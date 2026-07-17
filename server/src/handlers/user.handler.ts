import type { AppContext } from '../models/app.model';
import { createServices } from '../services/container';
import { currentUserId, logApiStep } from '../lib/auth';
import { createAppError } from '../models/error.model';

const requireSelf = (c: AppContext): string => {
  const userId = currentUserId(c);
  if (c.req.param('id') !== userId) {
    logApiStep(c, 'users.self_check.failed');
    throw createAppError(404, 'User not found.');
  }
  logApiStep(c, 'users.self_check.succeeded');
  return userId;
};

export async function getUser(c: AppContext) {
  logApiStep(c, 'users.get.lookup_started');
  const user = await createServices(c.env.DB).users.get(requireSelf(c));
  logApiStep(c, 'users.get.lookup_completed');
  return c.json(user);
}

export async function listUserRecipes(c: AppContext) {
  logApiStep(c, 'users.recipes.lookup_started');
  const services = createServices(c.env.DB);
  const userId = requireSelf(c);
  await services.users.get(userId);
  const data = await services.recipes.list(userId, c.req.query('q') ?? '', c.req.query('favorite') === 'true');
  logApiStep(c, 'users.recipes.lookup_completed', { resultCount: data.length });
  return c.json({ data, total: data.length });
}
