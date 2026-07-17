import type { AppContext } from '../models/app.model';
import { createServices } from '../services/container';
import { currentUserId } from '../lib/auth';

export async function listIngredients(c: AppContext) {
  const data = await createServices(c.env.DB).ingredients.list(currentUserId(c));
  return c.json({ data, total: data.length });
}
