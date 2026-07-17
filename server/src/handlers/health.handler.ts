import type { AppContext } from '../models/app.model';
import { createServices } from '../services/container';
import { logApiStep } from '../lib/auth';

export async function getRoot(c: AppContext) {
  logApiStep(c, 'system.info.started');
  logApiStep(c, 'system.info.ready');
  return c.json({ service: 'cravio-api', runtime: 'cloudflare-workers', framework: 'hono', database: 'd1' });
}

export async function getHealth(c: AppContext) {
  logApiStep(c, 'health.database_check.started');
  const health = await createServices(c.env.DB).health.getStatus();
  logApiStep(c, 'health.database_check.completed', { healthy: health.ok });
  return c.json(health);
}
