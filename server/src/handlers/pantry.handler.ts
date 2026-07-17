import type { AppContext } from '../models/app.model';
import { pantryCreateSchema, pantryUpdateSchema } from '../models/pantry.model';
import { createServices } from '../services/container';
import { readJson } from '../lib/http';
import { currentUserId, logApiStep } from '../lib/auth';

export async function listPantry(c: AppContext) {
  logApiStep(c, 'pantry.list.query_started');
  const data = await createServices(c.env.DB).pantry.list(currentUserId(c));
  logApiStep(c, 'pantry.list.query_completed', { resultCount: data.length });
  return c.json({ data, total: data.length });
}

export async function createPantryItem(c: AppContext) {
  logApiStep(c, 'pantry.create.validation_started');
  const input = pantryCreateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'pantry.create.validation_failed');
    return c.json({ error: 'Invalid pantry item.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'pantry.create.validation_succeeded', { fieldCount: Object.keys(input.data).length });
  const item = await createServices(c.env.DB).pantry.create(input.data, currentUserId(c));
  logApiStep(c, 'pantry.create.persisted', { pantryId: item.id });
  return c.json(item, 201);
}

export async function updatePantryItem(c: AppContext) {
  const pantryId = c.req.param('id')!;
  logApiStep(c, 'pantry.update.validation_started', { pantryId });
  const input = pantryUpdateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'pantry.update.validation_failed', { pantryId });
    return c.json({ error: 'Invalid pantry update.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'pantry.update.validation_succeeded', { pantryId, fieldCount: Object.keys(input.data).length });
  const item = await createServices(c.env.DB).pantry.update(pantryId, input.data, currentUserId(c));
  logApiStep(c, 'pantry.update.persisted', { pantryId });
  return c.json(item);
}

export async function removePantryItem(c: AppContext) {
  const pantryId = c.req.param('id')!;
  logApiStep(c, 'pantry.delete.started', { pantryId });
  await createServices(c.env.DB).pantry.delete(pantryId, currentUserId(c));
  logApiStep(c, 'pantry.delete.completed', { pantryId });
  return c.body(null, 204);
}
