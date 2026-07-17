import { Hono } from 'hono';
import type { AppEnv } from '../models/app.model';
import { getCurrentUser, logout, requestOtp, verifyOtp } from '../handlers/auth.handler';

export const authRoutes = new Hono<AppEnv>()
  .post('/otp/request', requestOtp)
  .post('/otp/verify', verifyOtp)
  .get('/me', getCurrentUser)
  .post('/logout', logout);
