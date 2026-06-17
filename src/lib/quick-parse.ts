import { addDays, getDay, nextDay, setHours, setMinutes, startOfDay, type Day } from 'date-fns';

import { Priority } from '@/db';

/**
 * Result of parsing the quick-add input. `dueAt` is epoch-ms (or null). The
 * recurrence engine (Milestone 5) consumes `recurrenceRule`; here we only detect
 * and encode it — completing a recurring task does not yet regenerate.
 */
export interface ParsedTask {
  title: string;
  dueAt: number | null;
  recurrenceRule: string | null;
  priority: Priority;
}

const WEEKDAYS: { names: string[]; day: Day; code: string }[] = [
  { names: ['sunday', 'sun'], day: 0, code: 'SUN' },
  { names: ['monday', 'mon'], day: 1, code: 'MON' },
  { names: ['tuesday', 'tue', 'tues'], day: 2, code: 'TUE' },
  { names: ['wednesday', 'wed'], day: 3, code: 'WED' },
  { names: ['thursday', 'thu', 'thurs'], day: 4, code: 'THU' },
  { names: ['friday', 'fri'], day: 5, code: 'FRI' },
  { names: ['saturday', 'sat'], day: 6, code: 'SAT' },
];

/** Resolve the nearest upcoming date for a weekday (today counts as a match). */
function upcomingWeekday(targetDay: Day, now: number): Date {
  if (getDay(now) === targetDay) return startOfDay(now);
  return startOfDay(nextDay(now, targetDay));
}

interface TimeOfDay {
  hours: number;
  minutes: number;
}

/** Extracts a time like "6pm", "6:30 pm", "at 18:00", "noon", "tonight". */
function extractTime(text: string): { rest: string; time: TimeOfDay | null } {
  // noon / midnight
  if (/\bnoon\b/i.test(text)) {
    return { rest: text.replace(/\bnoon\b/i, ' '), time: { hours: 12, minutes: 0 } };
  }
  if (/\bmidnight\b/i.test(text)) {
    return { rest: text.replace(/\bmidnight\b/i, ' '), time: { hours: 0, minutes: 0 } };
  }

  // 12h with am/pm: "6pm", "6:30 pm", "at 6 pm"
  const ampm = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?\b/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10) % 12;
    if (ampm[3].toLowerCase() === 'p') hours += 12;
    const minutes = ampm[2] ? parseInt(ampm[2], 10) : 0;
    return { rest: text.replace(ampm[0], ' '), time: { hours, minutes } };
  }

  // 24h: "at 18:00", "18:30"
  const h24 = text.match(/\b(?:at\s+)(\d{1,2})(?::(\d{2}))?\b/i);
  if (h24) {
    const hours = parseInt(h24[1], 10);
    const minutes = h24[2] ? parseInt(h24[2], 10) : 0;
    if (hours < 24 && minutes < 60) {
      return { rest: text.replace(h24[0], ' '), time: { hours, minutes } };
    }
  }

  // Fuzzy times of day.
  if (/\btonight\b/i.test(text)) {
    return { rest: text.replace(/\btonight\b/i, ' '), time: { hours: 20, minutes: 0 } };
  }
  if (/\bmorning\b/i.test(text)) {
    return { rest: text.replace(/\bmorning\b/i, ' '), time: { hours: 9, minutes: 0 } };
  }
  if (/\bafternoon\b/i.test(text)) {
    return { rest: text.replace(/\bafternoon\b/i, ' '), time: { hours: 15, minutes: 0 } };
  }
  if (/\bevening\b/i.test(text)) {
    return { rest: text.replace(/\bevening\b/i, ' '), time: { hours: 18, minutes: 0 } };
  }

  return { rest: text, time: null };
}

/** Extracts recurrence ("every day", "daily", "every mon,wed", "every 1st"). */
function extractRecurrence(text: string): { rest: string; rule: string | null } {
  if (/\b(every\s*day|daily)\b/i.test(text)) {
    return { rest: text.replace(/\b(every\s*day|daily)\b/i, ' '), rule: 'DAILY' };
  }

  // every <weekday>[, <weekday>...]  e.g. "every mon, wed, fri"
  const everyWeekday = text.match(
    /\bevery\s+((?:sun|mon|tue|tues|wed|thu|thurs|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s*(?:,|and|&)\s*\w+)*)/i
  );
  if (everyWeekday) {
    const codes: string[] = [];
    for (const wd of WEEKDAYS) {
      if (wd.names.some((n) => new RegExp(`\\b${n}\\b`, 'i').test(everyWeekday[1]))) {
        codes.push(wd.code);
      }
    }
    if (codes.length > 0) {
      return { rest: text.replace(everyWeekday[0], ' '), rule: `WEEKLY:${codes.join(',')}` };
    }
  }

  if (/\b(every\s*week|weekly)\b/i.test(text)) {
    return { rest: text.replace(/\b(every\s*week|weekly)\b/i, ' '), rule: 'WEEKLY' };
  }

  // every 1st / every 15th / monthly on the Nth
  const monthly = text.match(/\bevery\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (monthly) {
    const dom = parseInt(monthly[1], 10);
    if (dom >= 1 && dom <= 31) {
      return { rest: text.replace(monthly[0], ' '), rule: `MONTHLY:${dom}` };
    }
  }
  if (/\b(every\s*month|monthly)\b/i.test(text)) {
    return { rest: text.replace(/\b(every\s*month|monthly)\b/i, ' '), rule: 'MONTHLY' };
  }

  return { rest: text, rule: null };
}

/** Extracts a target day → startOfDay Date (no time component yet). */
function extractDay(text: string, now: number): { rest: string; day: Date | null } {
  if (/\btoday\b/i.test(text)) {
    return { rest: text.replace(/\btoday\b/i, ' '), day: startOfDay(now) };
  }
  if (/\btomorrow\b/i.test(text)) {
    return { rest: text.replace(/\btomorrow\b/i, ' '), day: startOfDay(addDays(now, 1)) };
  }
  // "next <weekday>" — the weekday in the following week.
  const next = text.match(
    /\bnext\s+(sun|mon|tue|tues|wed|thu|thurs|fri|sat|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i
  );
  if (next) {
    const wd = WEEKDAYS.find((w) => w.names.includes(next[1].toLowerCase()));
    if (wd) {
      return { rest: text.replace(next[0], ' '), day: startOfDay(nextDay(now, wd.day)) };
    }
  }
  // bare weekday — nearest upcoming (today counts).
  for (const wd of WEEKDAYS) {
    for (const name of wd.names) {
      const re = new RegExp(`\\b${name}\\b`, 'i');
      if (re.test(text)) {
        return { rest: text.replace(re, ' '), day: upcomingWeekday(wd.day, now) };
      }
    }
  }
  return { rest: text, day: null };
}

function extractPriority(text: string): { rest: string; priority: Priority } {
  const m = text.match(/\s(!{1,2})(?=\s|$)/);
  if (m) {
    return {
      rest: text.replace(m[0], ' '),
      priority: m[1].length === 2 ? Priority.High : Priority.Medium,
    };
  }
  return { rest: text, priority: Priority.None };
}

function cleanTitle(text: string, fallback: string): string {
  const cleaned = text.replace(/\s{2,}/g, ' ').replace(/\s+([,.])/g, '$1').trim();
  return cleaned.length > 0 ? cleaned : fallback.trim();
}

/**
 * Parses quick-add free text into a structured task. Order matters: recurrence
 * and time are pulled before the day so weekday tokens aren't double-claimed.
 */
export function parseQuickAdd(input: string, now: number = Date.now()): ParsedTask {
  const original = input;
  let text = ` ${input} `; // pad so \b word boundaries hit edges uniformly

  const priorityRes = extractPriority(text);
  text = priorityRes.rest;

  const recurrenceRes = extractRecurrence(text);
  text = recurrenceRes.rest;

  const timeRes = extractTime(text);
  text = timeRes.rest;

  const dayRes = extractDay(text, now);
  text = dayRes.rest;

  // Resolve dueAt from the detected day/time.
  let dueAt: number | null = null;
  let day = dayRes.day;

  // A weekly-by-weekday recurrence with no explicit day implies the first occurrence.
  if (!day && recurrenceRes.rule?.startsWith('WEEKLY:')) {
    const firstCode = recurrenceRes.rule.slice('WEEKLY:'.length).split(',')[0];
    const wd = WEEKDAYS.find((w) => w.code === firstCode);
    if (wd) day = upcomingWeekday(wd.day, now);
  }

  if (day || timeRes.time) {
    let base = day ?? startOfDay(now);
    if (timeRes.time) {
      base = setMinutes(setHours(base, timeRes.time.hours), timeRes.time.minutes);
      // If only a time was given and it's already past, roll to tomorrow.
      if (!day && base.getTime() < now) {
        base = setMinutes(
          setHours(addDays(startOfDay(now), 1), timeRes.time.hours),
          timeRes.time.minutes
        );
      }
    }
    dueAt = base.getTime();
  }

  return {
    title: cleanTitle(text, original),
    dueAt,
    recurrenceRule: recurrenceRes.rule,
    priority: priorityRes.priority,
  };
}
