import { Hono } from 'hono';
import type { AppEnv } from '../models/app.model';
import { createUser, getUser, listUserRecipes } from '../handlers/user.handler';

export const userRoutes = new Hono<AppEnv>()
  .post('/', createUser)
  .get('/:id', getUser)
  .get('/:id/recipes', listUserRecipes);
