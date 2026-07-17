import type { AppContext } from '../models/app.model';
import { pantryCreateSchema, pantryUpdateSchema } from '../models/pantry.model';
import { createServices } from '../services/container';
import { readJson } from '../lib/http';
import { currentUserId } from '../lib/auth';

export async function listPantry(c: AppContext) {
  const data = await createServices(c.env.DB).pantry.list(currentUserId(c));
  return c.json({ data, total: data.length });
}

export async function createPantryItem(c: AppContext) {
  const input = pantryCreateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'Invalid pantry item.', details: input.error.flatten() }, 400);
  return c.json(await createServices(c.env.DB).pantry.create(input.data, currentUserId(c)), 201);
}

export async function updatePantryItem(c: AppContext) {
  const input = pantryUpdateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'Invalid pantry update.', details: input.error.flatten() }, 400);
  return c.json(await createServices(c.env.DB).pantry.update(c.req.param('id')!, input.data, currentUserId(c)));
}

export async function removePantryItem(c: AppContext) {
  await createServices(c.env.DB).pantry.delete(c.req.param('id')!, currentUserId(c));
  return c.body(null, 204);
}
