import { createMiddleware } from 'hono/factory';
import { createApiStepLogger } from '../lib/logger';
import type { AppEnv } from '../models/app.model';

export const requestLogger = createMiddleware<AppEnv>(async (c, next) => {
  const startedAt = Date.now();
  const requestId = `req_${crypto.randomUUID()}`;
  const logStep = createApiStepLogger(requestId, c.req.method, normalizePath(c.req.path), c.req.header('cf-ray'));
  c.set('requestId', requestId);
  c.set('logStep', logStep);
  c.header('X-Request-Id', requestId);
  logStep('request.received');
  try {
    await next();
  } finally {
    logStep('response.completed', { status: c.res.status, durationMs: Date.now() - startedAt });
  }
});

const normalizePath = (path: string): string => {
  if (/^\/users\/[^/]+\/recipes$/.test(path)) return '/users/:id/recipes';
  if (/^\/users\/[^/]+$/.test(path)) return '/users/:id';
  if (/^\/(imports|recipes|pantry)\/[^/]+$/.test(path)) return path.replace(/\/[^/]+$/, '/:id');
  return path;
};
