import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../models/app.model';
import { createAuthRepository } from '../repositories/auth.repository';
import { createUserRepository } from '../repositories/user.repository';
import { createAuthService } from '../services/auth.service';
import { createEmailService } from '../services/email.service';

const publicRequests = new Set([
  'GET /',
  'GET /health',
  'POST /auth/otp/request',
  'POST /auth/otp/verify',
]);

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (c.req.method === 'OPTIONS' || publicRequests.has(`${c.req.method} ${c.req.path}`)) {
    await next();
    return;
  }

  const auth = createAuthService(
    createAuthRepository(c.env.DB),
    createUserRepository(c.env.DB),
    createEmailService(c.env.EMAIL, c.env.EMAIL_FROM),
    c.env.AUTH_SECRET,
  );
  const user = await auth.me(c.req.header('Authorization') ?? null);
  c.set('userId', user.id);
  await next();
});
