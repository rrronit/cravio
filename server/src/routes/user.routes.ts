import { Hono } from 'hono';
import type { AppEnv } from '../models/app.model';
import { getUser, listUserRecipes } from '../handlers/user.handler';

export const userRoutes = new Hono<AppEnv>()
  .get('/:id', getUser)
  .get('/:id/recipes', listUserRecipes);
