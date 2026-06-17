import type { LanguagePreference } from '@/db';

/**
 * Tiny dependency-free i18n. Flat key → string maps for English and Bangla.
 * `t(key)` falls back to English, then to the key itself, so a missing Bangla
 * string is never a blank label. (Swappable for react-i18next later.)
 */
export type TranslationKey = keyof typeof en;

const en = {
  'tab.today': 'Today',
  'tab.upcoming': 'Upcoming',
  'tab.all': 'All',
  'tab.lists': 'Lists',

  'today.title': 'Today',
  'today.empty.title': 'Nothing due today — nice.',
  'today.empty.subtitle': 'Add a task below, or enjoy the clear slate.',
  'today.quickadd': 'Add a task for today…',

  'upcoming.title': 'Upcoming',
  'upcoming.empty.title': 'Nothing scheduled ahead.',
  'upcoming.empty.subtitle': 'Plans you add for later will show up here.',
  'upcoming.quickadd': 'Add an upcoming task…',

  'all.title': 'All Tasks',
  'all.empty.title': 'No tasks yet.',
  'all.empty.subtitle': 'Capture anything on your mind — type below and hit enter.',
  'all.quickadd': 'Add a task…',

  'lists.title': 'Lists',
  'lists.empty.title': 'No lists yet.',
  'lists.empty.subtitle': 'Group tasks by project, place, or person. Tap + to start.',
  'list.empty.title': 'This list is empty.',
  'list.empty.subtitle': 'Add your first task below.',
  'list.quickadd': 'Add to this list…',
  'list.new': 'New list',
  'list.edit': 'Edit list',
  'list.name': 'List name',
  'list.color': 'Color',
  'list.icon': 'Icon',

  'search.title': 'Search',
  'search.placeholder': 'Search tasks…',
  'search.empty.title': 'No matches.',
  'search.empty.subtitle': 'Try a different word.',
  'search.prompt.title': 'Search your tasks',
  'search.prompt.subtitle': 'Find anything across every list.',

  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.theme.system': 'System',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.language': 'Language',

  'task.notes': 'Notes',
  'task.notes.placeholder': 'Add notes…',
  'task.priority': 'Priority',
  'task.due': 'Due',
  'task.subtasks': 'Subtasks',
  'task.subtask.add': 'Add a subtask…',
  'task.repeats': 'Repeats',
  'task.focus': 'Start focus session',

  'tab.habits': 'Habits',
  'habits.title': 'Habits',
  'habits.empty.title': 'No habits yet.',
  'habits.empty.subtitle': 'Build a streak — add a daily habit below.',
  'habits.add': 'Add a habit…',
  'habits.streak': 'day streak',
  'habits.delete.title': 'Delete habit?',
  'habits.delete.message': 'This removes the habit and its streak.',

  'pomodoro.title': 'Focus',
  'pomodoro.start': 'Start',
  'pomodoro.pause': 'Pause',
  'pomodoro.reset': 'Reset',
  'pomodoro.finish': 'Finish',
  'pomodoro.done.title': 'Session complete',

  'stats.title': 'Progress',
  'stats.completedToday': 'Completed today',
  'stats.completedWeek': 'Completed this week',
  'stats.focusToday': 'Focus today',
  'stats.focusWeek': 'Focus this week',
  'stats.streaks': 'Active streaks',
  'stats.streaks.empty': 'No active streaks yet — check in on a habit to start one.',

  'due.today': 'Today',
  'due.tomorrow': 'Tomorrow',
  'due.nextweek': 'Next week',
  'due.none': 'None',

  'priority.none': 'None',
  'priority.medium': 'Medium',
  'priority.high': 'High',

  'common.done': 'Done',
  'common.save': 'Save',
  'common.create': 'Create',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.undo': 'UNDO',
  'common.completed': 'Task completed',
  'common.deleted': 'Task deleted',
  'common.rescheduled': 'Rescheduled to tomorrow',
} as const;

const bn: Partial<Record<TranslationKey, string>> = {
  'tab.today': 'আজ',
  'tab.upcoming': 'আসন্ন',
  'tab.all': 'সব',
  'tab.lists': 'তালিকা',

  'today.title': 'আজ',
  'today.empty.title': 'আজ কিছু বাকি নেই — দারুণ।',
  'today.empty.subtitle': 'নিচে একটি কাজ যোগ করুন, কিংবা ফাঁকা দিনটা উপভোগ করুন।',
  'today.quickadd': 'আজকের জন্য একটি কাজ যোগ করুন…',

  'upcoming.title': 'আসন্ন',
  'upcoming.empty.title': 'সামনে কিছু নির্ধারিত নেই।',
  'upcoming.empty.subtitle': 'পরে করার জন্য যোগ করা কাজ এখানে দেখা যাবে।',
  'upcoming.quickadd': 'একটি আসন্ন কাজ যোগ করুন…',

  'all.title': 'সব কাজ',
  'all.empty.title': 'এখনও কোনো কাজ নেই।',
  'all.empty.subtitle': 'মনে যা আছে লিখে ফেলুন — নিচে টাইপ করে এন্টার চাপুন।',
  'all.quickadd': 'একটি কাজ যোগ করুন…',

  'lists.title': 'তালিকা',
  'lists.empty.title': 'এখনও কোনো তালিকা নেই।',
  'lists.empty.subtitle': 'প্রকল্প, স্থান বা ব্যক্তি অনুযায়ী কাজ ভাগ করুন। শুরু করতে + চাপুন।',
  'list.empty.title': 'এই তালিকাটি ফাঁকা।',
  'list.empty.subtitle': 'নিচে আপনার প্রথম কাজটি যোগ করুন।',
  'list.quickadd': 'এই তালিকায় যোগ করুন…',
  'list.new': 'নতুন তালিকা',
  'list.edit': 'তালিকা সম্পাদনা',
  'list.name': 'তালিকার নাম',
  'list.color': 'রঙ',
  'list.icon': 'আইকন',

  'search.title': 'খোঁজ',
  'search.placeholder': 'কাজ খুঁজুন…',
  'search.empty.title': 'কিছু মেলেনি।',
  'search.empty.subtitle': 'অন্য একটি শব্দ চেষ্টা করুন।',
  'search.prompt.title': 'আপনার কাজ খুঁজুন',
  'search.prompt.subtitle': 'সব তালিকা জুড়ে যেকোনো কিছু খুঁজে নিন।',

  'settings.title': 'সেটিংস',
  'settings.appearance': 'অবয়ব',
  'settings.theme': 'থিম',
  'settings.theme.system': 'সিস্টেম',
  'settings.theme.light': 'লাইট',
  'settings.theme.dark': 'ডার্ক',
  'settings.language': 'ভাষা',

  'task.notes': 'নোট',
  'task.notes.placeholder': 'নোট যোগ করুন…',
  'task.priority': 'অগ্রাধিকার',
  'task.due': 'সময়সীমা',
  'task.subtasks': 'উপ-কাজ',
  'task.subtask.add': 'একটি উপ-কাজ যোগ করুন…',
  'task.repeats': 'পুনরাবৃত্তি',
  'task.focus': 'ফোকাস সেশন শুরু করুন',

  'tab.habits': 'অভ্যাস',
  'habits.title': 'অভ্যাস',
  'habits.empty.title': 'এখনও কোনো অভ্যাস নেই।',
  'habits.empty.subtitle': 'একটি ধারা গড়ুন — নিচে একটি দৈনিক অভ্যাস যোগ করুন।',
  'habits.add': 'একটি অভ্যাস যোগ করুন…',
  'habits.streak': 'দিনের ধারা',
  'habits.delete.title': 'অভ্যাস মুছবেন?',
  'habits.delete.message': 'এটি অভ্যাস ও এর ধারা মুছে ফেলবে।',

  'pomodoro.title': 'ফোকাস',
  'pomodoro.start': 'শুরু',
  'pomodoro.pause': 'বিরতি',
  'pomodoro.reset': 'রিসেট',
  'pomodoro.finish': 'শেষ',
  'pomodoro.done.title': 'সেশন সম্পন্ন',

  'stats.title': 'অগ্রগতি',
  'stats.completedToday': 'আজ সম্পন্ন',
  'stats.completedWeek': 'এই সপ্তাহে সম্পন্ন',
  'stats.focusToday': 'আজকের ফোকাস',
  'stats.focusWeek': 'এই সপ্তাহের ফোকাস',
  'stats.streaks': 'চলমান ধারা',
  'stats.streaks.empty': 'এখনও কোনো চলমান ধারা নেই — শুরু করতে একটি অভ্যাসে চেক-ইন করুন।',

  'due.today': 'আজ',
  'due.tomorrow': 'আগামীকাল',
  'due.nextweek': 'পরের সপ্তাহ',
  'due.none': 'নেই',

  'priority.none': 'নেই',
  'priority.medium': 'মাঝারি',
  'priority.high': 'উচ্চ',

  'common.done': 'সম্পন্ন',
  'common.save': 'সংরক্ষণ',
  'common.create': 'তৈরি',
  'common.cancel': 'বাতিল',
  'common.delete': 'মুছুন',
  'common.undo': 'ফেরান',
  'common.completed': 'কাজ সম্পন্ন',
  'common.deleted': 'কাজ মুছে ফেলা হয়েছে',
  'common.rescheduled': 'আগামীকালের জন্য পুনঃনির্ধারিত',
};

const dictionaries: Record<LanguagePreference, Partial<Record<TranslationKey, string>>> = {
  en,
  bn,
};

export function translate(language: LanguagePreference, key: TranslationKey): string {
  return dictionaries[language][key] ?? en[key] ?? key;
}
