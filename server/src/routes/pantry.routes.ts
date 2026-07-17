import { Hono } from 'hono';
import { createPantryItem, listPantry, removePantryItem, updatePantryItem } from '../handlers/pantry.handler';
import type { AppEnv } from '../models/app.model';

export const pantryRoutes = new Hono<AppEnv>()
  .get('/', listPantry)
  .post('/', createPantryItem)
  .put('/:id', updatePantryItem)
  .delete('/:id', removePantryItem);
