import { getDatabase } from '../database';
import { newId } from '../id';
import type { PomodoroSession, PomodoroSessionRow } from '../types';

function mapRow(row: PomodoroSessionRow): PomodoroSession {
  return {
    id: row.id,
    taskId: row.task_id,
    duration: row.duration,
    completedAt: row.completed_at,
  };
}

export interface RecordSessionInput {
  taskId?: string | null;
  /** Focused duration in seconds. */
  duration: number;
}

/** Records a completed focus session. */
export async function recordSession(input: RecordSessionInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO pomodoro_sessions (id, task_id, duration, completed_at)
     VALUES ($id, $taskId, $duration, $completedAt)`,
    {
      $id: newId(),
      $taskId: input.taskId ?? null,
      $duration: input.duration,
      $completedAt: Date.now(),
    }
  );
}

/** Count of focus sessions completed since `sinceMs` (for the stats screen). */
export async function getSessionCountSince(sinceMs: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM pomodoro_sessions WHERE completed_at >= $since',
    { $since: sinceMs }
  );
  return row?.count ?? 0;
}

/** Recent sessions for a given task. */
export async function getSessionsForTask(taskId: string): Promise<PomodoroSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PomodoroSessionRow>(
    'SELECT * FROM pomodoro_sessions WHERE task_id = $taskId ORDER BY completed_at DESC',
    { $taskId: taskId }
  );
  return rows.map(mapRow);
}
