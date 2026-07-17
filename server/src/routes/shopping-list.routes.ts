import { Hono } from 'hono';
import type { AppEnv } from '../models/app.model';
import { createShoppingItem, listShoppingItems, removeShoppingItem } from '../handlers/shopping-list.handler';

export const shoppingListRoutes = new Hono<AppEnv>()
  .get('/', listShoppingItems)
  .post('/', createShoppingItem)
  .delete('/:id', removeShoppingItem);
