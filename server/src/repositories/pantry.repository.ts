import type { PantryItem, PantryRow } from '../models/pantry.model';

export const createPantryRepository = (db: D1Database) => ({
  findAll: async (userId: string, onlyAvailable = true): Promise<PantryItem[]> => {
    const query = onlyAvailable
      ? 'SELECT * FROM pantry_items WHERE user_id = ? AND available = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM pantry_items WHERE user_id = ? ORDER BY created_at DESC';
    const { results } = await db.prepare(query).bind(userId).all<PantryRow>();
    return results.map(mapPantryRow);
  },
  findById: async (id: string, userId: string): Promise<PantryItem | null> => {
    const row = await db.prepare('SELECT * FROM pantry_items WHERE id = ? AND user_id = ?').bind(id, userId).first<PantryRow>();
    return row ? mapPantryRow(row) : null;
  },
  save: async (item: PantryItem, userId: string): Promise<void> => {
    await db.prepare(`INSERT OR REPLACE INTO pantry_items (id,name,quantity,unit,expiry,available,created_at,user_id)
      VALUES (?,?,?,?,?,?,COALESCE((SELECT created_at FROM pantry_items WHERE id = ? AND user_id = ?),?),?)`).bind(
      item.id, item.name, item.quantity ?? null, item.unit ?? null, item.expiry ?? null, item.available ? 1 : 0,
      item.id, userId, new Date().toISOString(), userId,
    ).run();
  },
  delete: async (id: string, userId: string): Promise<void> => {
    await db.prepare('DELETE FROM pantry_items WHERE id = ? AND user_id = ?').bind(id, userId).run();
  },
});

export type PantryRepository = ReturnType<typeof createPantryRepository>;

const mapPantryRow = (row: PantryRow): PantryItem => ({
  id: row.id, name: row.name, quantity: row.quantity ?? undefined, unit: row.unit ?? undefined,
  expiry: row.expiry ?? undefined, available: Boolean(row.available),
});
