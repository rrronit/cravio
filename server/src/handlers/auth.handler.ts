import { readJson } from '../lib/http';
import type { AppContext } from '../models/app.model';
import { requestOtpSchema, verifyOtpSchema } from '../models/auth.model';
import { createAuthRepository } from '../repositories/auth.repository';
import { createUserRepository } from '../repositories/user.repository';
import { createAuthService } from '../services/auth.service';
import { createEmailService } from '../services/email.service';
import { logApiStep } from '../lib/auth';

const services = (c: AppContext) => createAuthService(
  createAuthRepository(c.env.DB),
  createUserRepository(c.env.DB),
  createEmailService(c.env.EMAIL, c.env.EMAIL_FROM),
  c.env.AUTH_SECRET,
);

export async function requestOtp(c: AppContext) {
  logApiStep(c, 'auth.otp_request.validation_started');
  const input = requestOtpSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'auth.otp_request.validation_failed');
    return c.json({ error: 'A valid email is required.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'auth.otp_request.validation_succeeded');
  logApiStep(c, 'auth.otp_request.email_send_started');
  await services(c).requestOtp(input.data.email);
  logApiStep(c, 'auth.otp_request.email_send_completed');
  return c.json({
    message: 'If the address can receive email, a sign-in code has been sent.',
    expiresIn: 600,
  }, 202);
}

export async function verifyOtp(c: AppContext) {
  logApiStep(c, 'auth.otp_verify.validation_started');
  const input = verifyOtpSchema.safeParse(await readJson(c.req.raw));
  if (!input.success) {
    logApiStep(c, 'auth.otp_verify.validation_failed');
    return c.json({ error: 'A valid email and 6-digit code are required.', details: input.error.flatten() }, 400);
  }
  logApiStep(c, 'auth.otp_verify.validation_succeeded');
  logApiStep(c, 'auth.otp_verify.session_creation_started');
  const result = await services(c).verifyOtp(input.data.email, input.data.code);
  logApiStep(c, 'auth.otp_verify.session_creation_completed');
  return c.json(result);
}

export async function getCurrentUser(c: AppContext) {
  logApiStep(c, 'auth.current_user.lookup_started');
  const user = await services(c).me(c.req.header('Authorization') ?? null);
  logApiStep(c, 'auth.current_user.lookup_completed');
  return c.json(user);
}

export async function logout(c: AppContext) {
  logApiStep(c, 'auth.logout.revocation_started');
  await services(c).logout(c.req.header('Authorization') ?? null);
  logApiStep(c, 'auth.logout.revocation_completed');
  return c.body(null, 204);
}
