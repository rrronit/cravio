import type { AppContext } from '../models/app.model';
import { createServices } from '../services/container';
import { currentUserId, logApiStep } from '../lib/auth';

export async function listIngredients(c: AppContext) {
  logApiStep(c, 'ingredients.list.query_started');
  const data = await createServices(c.env.DB).ingredients.list(currentUserId(c));
  logApiStep(c, 'ingredients.list.query_completed', { resultCount: data.length });
  return c.json({ data, total: data.length });
}
