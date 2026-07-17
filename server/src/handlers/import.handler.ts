import type { AppContext } from '../models/app.model';
import { importCreateSchema } from '../models/import.model';
import { createServices } from '../services/container';
import { readJson } from '../lib/http';
import { currentUserId, logApiStep } from '../lib/auth';

export async function createImport(c: AppContext) {
  logApiStep(c, 'import.create.validation_started');
  const input = importCreateSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'import.create.validation_failed');
    return c.json({ error: 'A valid recipe video URL is required.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'import.create.validation_succeeded', { platform: detectSafePlatform(input.data.url) });
  const services = createServices(c.env.DB);
  const userId = currentUserId(c);
  logApiStep(c, 'import.create.user_check_started');
  await services.users.get(userId);
  logApiStep(c, 'import.create.job_creation_started');
  const job = await services.imports.create(input.data, userId);
  logApiStep(c, 'import.create.job_created', { jobId: job.id, status: job.status });
  return c.json(job, 202);
}

export async function getImport(c: AppContext) {
  const jobId = c.req.param('id')!;
  logApiStep(c, 'import.poll.lookup_started', { jobId });
  const job = await createServices(c.env.DB).imports.getAndAdvance(jobId, currentUserId(c));
  logApiStep(c, 'import.poll.transition_completed', { jobId, status: job.status, progress: job.progress });
  return c.json(job);
}

const detectSafePlatform = (url: string): string => {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes('instagram')) return 'instagram';
  if (hostname.includes('tiktok')) return 'tiktok';
  if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'youtube';
  return 'other';
};
