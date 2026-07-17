import { Hono } from 'hono';
import { getRecipe, listRecipes, removeRecipe, updateRecipe } from '../handlers/recipe.handler';
import type { AppEnv } from '../models/app.model';

export const recipeRoutes = new Hono<AppEnv>()
  .get('/', listRecipes)
  .get('/:id', getRecipe)
  .put('/:id', updateRecipe)
  .delete('/:id', removeRecipe);
