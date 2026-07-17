import type { AppContext } from '../models/app.model';
import { recipeUpdateSchema } from '../models/recipe.model';
import { createServices } from '../services/container';
import { readJson } from '../lib/http';
import { currentUserId, logApiStep } from '../lib/auth';

export async function listRecipes(c: AppContext) {
  logApiStep(c, 'recipes.list.query_started', { hasQuery: Boolean(c.req.query('q')), favoriteOnly: c.req.query('favorite') === 'true' });
  const data = await createServices(c.env.DB).recipes.list(currentUserId(c), c.req.query('q') ?? '', c.req.query('favorite') === 'true');
  logApiStep(c, 'recipes.list.query_completed', { resultCount: data.length });
  return c.json({ data, total: data.length });
}

export async function getRecipe(c: AppContext) {
  const recipeId = c.req.param('id')!;
  logApiStep(c, 'recipes.get.lookup_started', { recipeId });
  const recipe = await createServices(c.env.DB).recipes.get(recipeId, currentUserId(c));
  logApiStep(c, 'recipes.get.lookup_completed', { recipeId });
  return c.json(recipe);
}

export async function updateRecipe(c: AppContext) {
  const recipeId = c.req.param('id')!;
  logApiStep(c, 'recipes.update.validation_started', { recipeId });
  const input = recipeUpdateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'recipes.update.validation_failed', { recipeId });
    return c.json({ error: 'Invalid recipe update.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'recipes.update.validation_succeeded', { recipeId, fieldCount: Object.keys(input.data).length });
  const recipe = await createServices(c.env.DB).recipes.update(recipeId, currentUserId(c), input.data);
  logApiStep(c, 'recipes.update.persisted', { recipeId });
  return c.json(recipe);
}

export async function removeRecipe(c: AppContext) {
  const recipeId = c.req.param('id')!;
  logApiStep(c, 'recipes.delete.started', { recipeId });
  await createServices(c.env.DB).recipes.delete(recipeId, currentUserId(c));
  logApiStep(c, 'recipes.delete.completed', { recipeId });
  return c.body(null, 204);
}
