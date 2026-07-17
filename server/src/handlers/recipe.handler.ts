import type { AppContext } from '../models/app.model';
import { recipeUpdateSchema } from '../models/recipe.model';
import { createServices } from '../services/container';
import { readJson } from '../lib/http';
import { currentUserId } from '../lib/auth';

export async function listRecipes(c: AppContext) {
  const data = await createServices(c.env.DB).recipes.list(currentUserId(c.req.raw), c.req.query('q') ?? '', c.req.query('favorite') === 'true');
  return c.json({ data, total: data.length });
}

export async function getRecipe(c: AppContext) {
  return c.json(await createServices(c.env.DB).recipes.get(c.req.param('id')!, currentUserId(c.req.raw)));
}

export async function updateRecipe(c: AppContext) {
  const input = recipeUpdateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'Invalid recipe update.', details: input.error.flatten() }, 400);
  return c.json(await createServices(c.env.DB).recipes.update(c.req.param('id')!, currentUserId(c.req.raw), input.data));
}

export async function removeRecipe(c: AppContext) {
  await createServices(c.env.DB).recipes.delete(c.req.param('id')!, currentUserId(c.req.raw));
  return c.body(null, 204);
}
