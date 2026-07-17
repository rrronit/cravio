import { Hono } from 'hono';
import { createImport, getImport } from '../handlers/import.handler';
import type { AppEnv } from '../models/app.model';

export const importRoutes = new Hono<AppEnv>()
  .post('/', createImport)
  .get('/:id', getImport);
