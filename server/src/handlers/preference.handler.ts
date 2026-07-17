import type { AppContext } from '../models/app.model';
import { preferenceUpdateSchema } from '../models/preference.model';
import { currentUserId, logApiStep } from '../lib/auth';
import { readJson } from '../lib/http';
import { createServices } from '../services/container';

export async function getPreferences(c: AppContext) {
  logApiStep(c, 'preferences.get.query_started');
  const preferences = await createServices(c.env.DB).preferences.get(currentUserId(c));
  logApiStep(c, 'preferences.get.query_completed');
  return c.json(preferences);
}

export async function updatePreferences(c: AppContext) {
  logApiStep(c, 'preferences.update.validation_started');
  const input = preferenceUpdateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'preferences.update.validation_failed');
    return c.json({ error: 'Invalid preference update.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'preferences.update.validation_succeeded', { fieldCount: Object.keys(input.data).length });
  const preferences = await createServices(c.env.DB).preferences.update(currentUserId(c), input.data);
  logApiStep(c, 'preferences.update.persisted');
  return c.json(preferences);
}
