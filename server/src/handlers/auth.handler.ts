import { readJson } from '../lib/http';
import type { AppContext } from '../models/app.model';
import { requestOtpSchema, verifyOtpSchema } from '../models/auth.model';
import { createAuthRepository } from '../repositories/auth.repository';
import { createUserRepository } from '../repositories/user.repository';
import { createAuthService } from '../services/auth.service';
import { createEmailService } from '../services/email.service';

const services = (c: AppContext) => createAuthService(
  createAuthRepository(c.env.DB),
  createUserRepository(c.env.DB),
  createEmailService(c.env.EMAIL, c.env.EMAIL_FROM),
  c.env.AUTH_SECRET,
);

export async function requestOtp(c: AppContext) {
  const input = requestOtpSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'A valid email is required.', details: input.error.flatten() }, 400);
  await services(c).requestOtp(input.data.email);
  return c.json({
    message: 'If the address can receive email, a sign-in code has been sent.',
    expiresIn: 600,
  }, 202);
}

export async function verifyOtp(c: AppContext) {
  const input = verifyOtpSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'A valid email and 6-digit code are required.', details: input.error.flatten() }, 400);
  return c.json(await services(c).verifyOtp(input.data.email, input.data.code));
}

export async function getCurrentUser(c: AppContext) {
  return c.json(await services(c).me(c.req.header('Authorization') ?? null));
}

export async function logout(c: AppContext) {
  await services(c).logout(c.req.header('Authorization') ?? null);
  return c.body(null, 204);
}
