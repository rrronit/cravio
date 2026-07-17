import type { AppContext } from '../models/app.model';
import { currentUserId, logApiStep } from '../lib/auth';
import { readJson } from '../lib/http';
import { shoppingListCreateSchema } from '../models/shopping-list.model';
import { createServices } from '../services/container';

export async function listShoppingItems(c: AppContext) {
  logApiStep(c, 'shopping_list.list.query_started');
  const data = await createServices(c.env.DB).shoppingList.list(currentUserId(c));
  logApiStep(c, 'shopping_list.list.query_completed', { resultCount: data.length });
  return c.json({ data, total: data.length });
}

export async function createShoppingItem(c: AppContext) {
  logApiStep(c, 'shopping_list.create.validation_started');
  const input = shoppingListCreateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'shopping_list.create.validation_failed');
    return c.json({ error: 'Invalid shopping list item.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'shopping_list.create.validation_succeeded', { hasQuantity: Boolean(input.data.quantity) });
  const item = await createServices(c.env.DB).shoppingList.create(input.data, currentUserId(c));
  logApiStep(c, 'shopping_list.create.persisted', { shoppingItemId: item.id });
  return c.json(item, 201);
}

export async function removeShoppingItem(c: AppContext) {
  const shoppingItemId = c.req.param('id')!;
  logApiStep(c, 'shopping_list.delete.started', { shoppingItemId });
  await createServices(c.env.DB).shoppingList.delete(shoppingItemId, currentUserId(c));
  logApiStep(c, 'shopping_list.delete.completed', { shoppingItemId });
  return c.body(null, 204);
}
