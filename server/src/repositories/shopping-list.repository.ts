import type { ShoppingListItem, ShoppingListItemRow } from '../models/shopping-list.model';

export const createShoppingListRepository = (db: D1Database) => ({
  findAll: async (userId: string): Promise<ShoppingListItem[]> => {
    const { results } = await db.prepare(`SELECT id,name,quantity,created_at FROM shopping_list_items
      WHERE user_id = ? ORDER BY created_at DESC`).bind(userId).all<ShoppingListItemRow>();
    return results.map(mapShoppingListItem);
  },

  findById: async (id: string, userId: string): Promise<ShoppingListItem | null> => {
    const row = await db.prepare(`SELECT id,name,quantity,created_at FROM shopping_list_items
      WHERE id = ? AND user_id = ?`).bind(id, userId).first<ShoppingListItemRow>();
    return row ? mapShoppingListItem(row) : null;
  },

  upsert: async (item: ShoppingListItem, userId: string): Promise<ShoppingListItem> => {
    await db.prepare(`INSERT INTO shopping_list_items (id,user_id,name,quantity,created_at) VALUES (?,?,?,?,?)
      ON CONFLICT(user_id,name) DO UPDATE SET quantity = COALESCE(excluded.quantity,shopping_list_items.quantity)`)
      .bind(item.id, userId, item.name, item.quantity ?? null, item.createdAt).run();
    const row = await db.prepare(`SELECT id,name,quantity,created_at FROM shopping_list_items
      WHERE user_id = ? AND name = ? COLLATE NOCASE`).bind(userId, item.name).first<ShoppingListItemRow>();
    if (!row) throw new Error('Shopping list item could not be saved.');
    return mapShoppingListItem(row);
  },

  delete: async (id: string, userId: string): Promise<void> => {
    await db.prepare('DELETE FROM shopping_list_items WHERE id = ? AND user_id = ?').bind(id, userId).run();
  },
});

export type ShoppingListRepository = ReturnType<typeof createShoppingListRepository>;

const mapShoppingListItem = (row: ShoppingListItemRow): ShoppingListItem => ({
  id: row.id,
  name: row.name,
  quantity: row.quantity ?? undefined,
  createdAt: row.created_at,
});
