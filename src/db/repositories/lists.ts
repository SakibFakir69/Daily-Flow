import { type SQLiteBindValue } from 'expo-sqlite';

import { getDatabase } from '../database';
import { newId } from '../id';
import type { List, ListRow } from '../types';

function mapRow(row: ListRow): List {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

export interface CreateListInput {
  name: string;
  color?: string | null;
  icon?: string | null;
  sortOrder?: number;
}

export async function createList(input: CreateListInput): Promise<List> {
  const db = await getDatabase();
  const list: List = {
    id: newId(),
    name: input.name,
    color: input.color ?? null,
    icon: input.icon ?? null,
    sortOrder: input.sortOrder ?? Date.now(),
  };

  await db.runAsync(
    `INSERT INTO lists (id, name, color, icon, sort_order)
     VALUES ($id, $name, $color, $icon, $sortOrder)`,
    {
      $id: list.id,
      $name: list.name,
      $color: list.color,
      $icon: list.icon,
      $sortOrder: list.sortOrder,
    }
  );

  return list;
}

export async function getLists(): Promise<List[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ListRow>(
    'SELECT * FROM lists ORDER BY sort_order ASC'
  );
  return rows.map(mapRow);
}

export async function getListById(id: string): Promise<List | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ListRow>(
    'SELECT * FROM lists WHERE id = $id',
    { $id: id }
  );
  return row ? mapRow(row) : null;
}

export type UpdateListInput = Partial<Pick<List, 'name' | 'color' | 'icon' | 'sortOrder'>>;

const UPDATE_COLUMNS: Record<keyof UpdateListInput, string> = {
  name: 'name',
  color: 'color',
  icon: 'icon',
  sortOrder: 'sort_order',
};

export async function updateList(id: string, patch: UpdateListInput): Promise<void> {
  const entries = Object.entries(patch) as [keyof UpdateListInput, unknown][];
  if (entries.length === 0) return;

  const assignments: string[] = [];
  const params: Record<string, SQLiteBindValue> = { $id: id };
  for (const [key, value] of entries) {
    assignments.push(`${UPDATE_COLUMNS[key]} = $${key}`);
    params[`$${key}`] = value as SQLiteBindValue;
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE lists SET ${assignments.join(', ')} WHERE id = $id`,
    params
  );
}

/** Convenience helper for drag-reorder (fractional sort_order between neighbors). */
export async function reorderList(id: string, sortOrder: number): Promise<void> {
  await updateList(id, { sortOrder });
}

/** Deleting a list sets its tasks' list_id to NULL (they fall to Inbox) via the FK. */
export async function deleteList(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM lists WHERE id = $id', { $id: id });
}
