import { type SQLiteBindValue } from 'expo-sqlite';

import { nextFutureOccurrence } from '@/lib/recurrence';
import { getDatabase } from '../database';
import { newId } from '../id';
import { Priority, type Task, type TaskRow } from '../types';

/** Maps a raw snake_case row to the camelCase domain `Task`. */
function mapRow(row: TaskRow): Task {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    notes: row.notes,
    dueAt: row.due_at,
    reminderAt: parseReminderAt(row.reminder_at),
    priority: row.priority as Priority,
    recurrenceRule: row.recurrence_rule,
    completedAt: row.completed_at,
    parentTaskId: row.parent_task_id,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
  };
}

/** `reminder_at` is a JSON array of epoch-ms stored as TEXT; tolerate null/garbage. */
function parseReminderAt(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === 'number')
      : [];
  } catch {
    return [];
  }
}

function serializeReminderAt(reminders: number[]): string | null {
  return reminders.length > 0 ? JSON.stringify(reminders) : null;
}

/** Fields a caller may supply when creating a task. Everything else is defaulted. */
export interface CreateTaskInput {
  title: string;
  listId?: string | null;
  notes?: string | null;
  dueAt?: number | null;
  reminderAt?: number[];
  priority?: Priority;
  recurrenceRule?: string | null;
  parentTaskId?: string | null;
  sortOrder?: number;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = await getDatabase();
  const task: Task = {
    id: newId(),
    listId: input.listId ?? null,
    title: input.title,
    notes: input.notes ?? null,
    dueAt: input.dueAt ?? null,
    reminderAt: input.reminderAt ?? [],
    priority: input.priority ?? Priority.None,
    recurrenceRule: input.recurrenceRule ?? null,
    completedAt: null,
    parentTaskId: input.parentTaskId ?? null,
    createdAt: Date.now(),
    sortOrder: input.sortOrder ?? Date.now(),
  };

  await db.runAsync(
    `INSERT INTO tasks
       (id, list_id, title, notes, due_at, reminder_at, priority,
        recurrence_rule, completed_at, parent_task_id, created_at, sort_order)
     VALUES
       ($id, $listId, $title, $notes, $dueAt, $reminderAt, $priority,
        $recurrenceRule, $completedAt, $parentTaskId, $createdAt, $sortOrder)`,
    {
      $id: task.id,
      $listId: task.listId,
      $title: task.title,
      $notes: task.notes,
      $dueAt: task.dueAt,
      $reminderAt: serializeReminderAt(task.reminderAt),
      $priority: task.priority,
      $recurrenceRule: task.recurrenceRule,
      $completedAt: task.completedAt,
      $parentTaskId: task.parentTaskId,
      $createdAt: task.createdAt,
      $sortOrder: task.sortOrder,
    }
  );

  return task;
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TaskRow>(
    'SELECT * FROM tasks WHERE id = $id',
    { $id: id }
  );
  return row ? mapRow(row) : null;
}

/** Fields that may be patched. Omitted keys are left unchanged. */
export type UpdateTaskInput = Partial<
  Pick<
    Task,
    | 'listId'
    | 'title'
    | 'notes'
    | 'dueAt'
    | 'reminderAt'
    | 'priority'
    | 'recurrenceRule'
    | 'completedAt'
    | 'parentTaskId'
    | 'sortOrder'
  >
>;

/** Maps domain field names to (column, serialized value) for a dynamic UPDATE. */
const UPDATE_COLUMNS: Record<
  keyof UpdateTaskInput,
  (value: never) => { column: string; value: SQLiteBindValue }
> = {
  listId: (v: string | null) => ({ column: 'list_id', value: v }),
  title: (v: string) => ({ column: 'title', value: v }),
  notes: (v: string | null) => ({ column: 'notes', value: v }),
  dueAt: (v: number | null) => ({ column: 'due_at', value: v }),
  reminderAt: (v: number[]) => ({
    column: 'reminder_at',
    value: serializeReminderAt(v),
  }),
  priority: (v: Priority) => ({ column: 'priority', value: v }),
  recurrenceRule: (v: string | null) => ({ column: 'recurrence_rule', value: v }),
  completedAt: (v: number | null) => ({ column: 'completed_at', value: v }),
  parentTaskId: (v: string | null) => ({ column: 'parent_task_id', value: v }),
  sortOrder: (v: number) => ({ column: 'sort_order', value: v }),
} as const;

export async function updateTask(
  id: string,
  patch: UpdateTaskInput
): Promise<void> {
  const entries = Object.entries(patch) as [keyof UpdateTaskInput, never][];
  if (entries.length === 0) return;

  const assignments: string[] = [];
  const params: Record<string, SQLiteBindValue> = { $id: id };

  for (const [key, rawValue] of entries) {
    const { column, value } = UPDATE_COLUMNS[key](rawValue);
    assignments.push(`${column} = $${key}`);
    params[`$${key}`] = value;
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE tasks SET ${assignments.join(', ')} WHERE id = $id`,
    params
  );
}

/** Marks a task complete/incomplete. `completed` true stamps now (unless `at` given). */
export async function setTaskCompleted(
  id: string,
  completed: boolean,
  at: number = Date.now()
): Promise<void> {
  // NOTE: recurrence regeneration on completion is intentionally NOT here.
  // That belongs to the recurrence engine (Milestone 5).
  await updateTask(id, { completedAt: completed ? at : null });
}

/**
 * Completes a task and, if it recurs, immediately inserts the next instance —
 * the original stays completed as history. Returns the newly created instance,
 * or null for one-off tasks. This is the single entry point both the UI and the
 * notification "Mark done" action use so recurrence behaves identically.
 *
 * The next due date is computed from the task's own due date (falling back to
 * the completion time), rolled forward past any missed occurrences. Explicit
 * reminders are shifted by the same delta the due date moved.
 */
export async function completeTaskAndRegenerate(
  id: string,
  at: number = Date.now()
): Promise<Task | null> {
  const task = await getTaskById(id);
  if (!task) return null;

  await setTaskCompleted(id, true, at);
  if (!task.recurrenceRule) return null;

  const base = task.dueAt ?? at;
  const nextDue = nextFutureOccurrence(task.recurrenceRule, base, at);
  if (nextDue === null) return null;

  const delta = task.dueAt !== null ? nextDue - task.dueAt : 0;
  const reminderAt =
    task.dueAt !== null ? task.reminderAt.map((r) => r + delta) : [];

  return createTask({
    title: task.title,
    listId: task.listId,
    notes: task.notes,
    dueAt: nextDue,
    reminderAt,
    priority: task.priority,
    recurrenceRule: task.recurrenceRule,
    parentTaskId: task.parentTaskId,
    sortOrder: task.sortOrder,
  });
}

/** Deleting cascades to subtasks via the parent_task_id FK (ON DELETE CASCADE). */
export async function deleteTask(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tasks WHERE id = $id', { $id: id });
}

// ── View queries ─────────────────────────────────────────────────────────────
// Views only ever show top-level tasks (parent_task_id IS NULL); subtasks are
// fetched per-parent. Ordering: incomplete by sort_order, completed sink to bottom.

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE parent_task_id IS NULL
     ORDER BY completed_at IS NOT NULL, sort_order ASC`
  );
  return rows.map(mapRow);
}

export async function getTasksByList(listId: string | null): Promise<Task[]> {
  const db = await getDatabase();
  const rows =
    listId === null
      ? await db.getAllAsync<TaskRow>(
          `SELECT * FROM tasks
           WHERE parent_task_id IS NULL AND list_id IS NULL
           ORDER BY completed_at IS NOT NULL, sort_order ASC`
        )
      : await db.getAllAsync<TaskRow>(
          `SELECT * FROM tasks
           WHERE parent_task_id IS NULL AND list_id = $listId
           ORDER BY completed_at IS NOT NULL, sort_order ASC`,
          { $listId: listId }
        );
  return rows.map(mapRow);
}

/**
 * Today view: incomplete tasks that are overdue or due before `endOfTodayMs`
 * (the start of tomorrow, computed by the caller via date-fns). Aggregates
 * across all lists.
 */
export async function getTodayTasks(endOfTodayMs: number): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE parent_task_id IS NULL
       AND completed_at IS NULL
       AND due_at IS NOT NULL
       AND due_at < $end
     ORDER BY due_at ASC, sort_order ASC`,
    { $end: endOfTodayMs }
  );
  return rows.map(mapRow);
}

/** Upcoming view: incomplete tasks due on/after `startOfTomorrowMs`. */
export async function getUpcomingTasks(startOfTomorrowMs: number): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE parent_task_id IS NULL
       AND completed_at IS NULL
       AND due_at IS NOT NULL
       AND due_at >= $start
     ORDER BY due_at ASC, sort_order ASC`,
    { $start: startOfTomorrowMs }
  );
  return rows.map(mapRow);
}

/**
 * Active (incomplete) top-level tasks that may need a reminder scheduled —
 * either an explicit `reminder_at` or a `due_at`. The notification scheduler
 * filters these down to future, non-quiet-hours times.
 */
export async function getActiveReminderTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE parent_task_id IS NULL
       AND completed_at IS NULL
       AND (reminder_at IS NOT NULL OR due_at IS NOT NULL)`
  );
  return rows.map(mapRow);
}

/**
 * Full-text-ish search across all tasks (title + notes), case-insensitive.
 * Includes subtasks and completed tasks; incomplete sort first, then by recency.
 */
export async function searchTasks(query: string): Promise<Task[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  const db = await getDatabase();
  const like = `%${trimmed.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE (title LIKE $like ESCAPE '\\' OR notes LIKE $like ESCAPE '\\')
     ORDER BY completed_at IS NOT NULL, created_at DESC
     LIMIT 100`,
    { $like: like }
  );
  return rows.map(mapRow);
}

/** Count of tasks completed at or after `sinceMs` (for the stats screen). */
export async function getCompletedCountSince(sinceMs: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= $since',
    { $since: sinceMs }
  );
  return row?.count ?? 0;
}

/** Incomplete top-level task counts per list id (Inbox/null is omitted). */
export async function getIncompleteCountsByList(): Promise<Record<string, number>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ list_id: string | null; count: number }>(
    `SELECT list_id, COUNT(*) AS count FROM tasks
     WHERE parent_task_id IS NULL AND completed_at IS NULL
     GROUP BY list_id`
  );
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.list_id) counts[row.list_id] = row.count;
  }
  return counts;
}

/**
 * Persists a drag-reorder by writing each task's position as its new
 * `sort_order` (0..n-1). Run in a single transaction so the list never renders
 * half-reordered.
 */
export async function applyTaskOrder(orderedIds: string[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync('UPDATE tasks SET sort_order = $order WHERE id = $id', {
        $order: i,
        $id: orderedIds[i],
      });
    }
  });
}

/** Subtasks/checklist items for a given parent, in sort order. */
export async function getSubtasks(parentId: string): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE parent_task_id = $parentId
     ORDER BY sort_order ASC`,
    { $parentId: parentId }
  );
  return rows.map(mapRow);
}
