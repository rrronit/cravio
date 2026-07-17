import type { AppContext } from '../models/app.model';
import { importCreateSchema } from '../models/import.model';
import { createServices } from '../services/container';
import { readJson } from '../lib/http';
import { logImportRejection } from '../lib/logger';
import { currentUserId } from '../lib/auth';

export async function createImport(c: AppContext) {
  const input = importCreateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logImportRejection('A valid recipe video URL is required.');
    return c.json({ error: 'A valid recipe video URL is required.', details: input.error.flatten() }, 400);
  }
  const services = createServices(c.env.DB);
  const userId = currentUserId(c);
  await services.users.get(userId);
  return c.json(await services.imports.create(input.data, userId), 202);
}

export async function getImport(c: AppContext) {
  return c.json(await createServices(c.env.DB).imports.getAndAdvance(c.req.param('id')!, currentUserId(c)));
}
