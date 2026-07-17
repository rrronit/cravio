import { Hono } from 'hono';
import { listIngredients } from '../handlers/ingredient.handler';
import type { AppEnv } from '../models/app.model';

export const ingredientRoutes = new Hono<AppEnv>().get('/', listIngredients);
