import type { AppContext } from '../models/app.model';
import { createServices } from '../services/container';

export async function getRoot(c: AppContext) {
  return c.json({ service: 'cravio-api', runtime: 'cloudflare-workers', framework: 'hono', database: 'd1' });
}

export async function getHealth(c: AppContext) {
  return c.json(await createServices(c.env.DB).health.getStatus());
}
