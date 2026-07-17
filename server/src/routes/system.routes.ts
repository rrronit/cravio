import { Hono } from 'hono';
import { getHealth, getRoot } from '../handlers/health.handler';
import type { AppEnv } from '../models/app.model';

export const systemRoutes = new Hono<AppEnv>()
  .get('/', getRoot)
  .get('/health', getHealth);
