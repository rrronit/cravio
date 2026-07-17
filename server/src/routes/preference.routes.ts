import { Hono } from 'hono';
import type { AppEnv } from '../models/app.model';
import { getPreferences, updatePreferences } from '../handlers/preference.handler';

export const preferenceRoutes = new Hono<AppEnv>()
  .get('/', getPreferences)
  .put('/', updatePreferences);
