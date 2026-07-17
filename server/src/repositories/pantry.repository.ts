import type { PantryItem, PantryRow } from '../models/pantry.model';

export class PantryRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(onlyAvailable = true): Promise<PantryItem[]> {
    const query = onlyAvailable
      ? 'SELECT * FROM pantry_items WHERE available = 1 ORDER BY created_at DESC'
      : 'SELECT * FROM pantry_items ORDER BY created_at DESC';
    const { results } = await this.db.prepare(query).all<PantryRow>();
    return results.map(mapPantryRow);
  }

  async findById(id: string): Promise<PantryItem | null> {
    const row = await this.db.prepare('SELECT * FROM pantry_items WHERE id = ?').bind(id).first<PantryRow>();
    return row ? mapPantryRow(row) : null;
  }

  async save(item: PantryItem): Promise<void> {
    await this.db.prepare(`INSERT OR REPLACE INTO pantry_items (id,name,quantity,unit,expiry,available,created_at)
      VALUES (?,?,?,?,?,?,COALESCE((SELECT created_at FROM pantry_items WHERE id = ?),?))`).bind(
        item.id, item.name, item.quantity ?? null, item.unit ?? null, item.expiry ?? null, item.available ? 1 : 0,
        item.id, new Date().toISOString(),
      ).run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM pantry_items WHERE id = ?').bind(id).run();
  }
}

function mapPantryRow(row: PantryRow): PantryItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity ?? undefined,
    unit: row.unit ?? undefined,
    expiry: row.expiry ?? undefined,
    available: Boolean(row.available),
  };
}
