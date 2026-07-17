import type { AppContext } from '../models/app.model';
import { readJson } from '../lib/http';
import { userCreateSchema } from '../models/user.model';
import { createServices } from '../services/container';

export async function createUser(c: AppContext) {
  const input = userCreateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'Invalid user.', details: input.error.flatten() }, 400);
  return c.json(await createServices(c.env.DB).users.create(input.data), 201);
}

export async function getUser(c: AppContext) {
  return c.json(await createServices(c.env.DB).users.get(c.req.param('id')!));
}

export async function listUserRecipes(c: AppContext) {
  const services = createServices(c.env.DB);
  const userId = c.req.param('id')!;
  await services.users.get(userId);
  const data = await services.recipes.list(userId, c.req.query('q') ?? '', c.req.query('favorite') === 'true');
  return c.json({ data, total: data.length });
}
