import type { AppContext } from '../models/app.model';
import { createServices } from '../services/container';
import { currentUserId } from '../lib/auth';
import { createAppError } from '../models/error.model';

const requireSelf = (c: AppContext): string => {
  const userId = currentUserId(c);
  if (c.req.param('id') !== userId) throw createAppError(404, 'User not found.');
  return userId;
};

export async function getUser(c: AppContext) {
  return c.json(await createServices(c.env.DB).users.get(requireSelf(c)));
}

export async function listUserRecipes(c: AppContext) {
  const services = createServices(c.env.DB);
  const userId = requireSelf(c);
  await services.users.get(userId);
  const data = await services.recipes.list(userId, c.req.query('q') ?? '', c.req.query('favorite') === 'true');
  return c.json({ data, total: data.length });
}
