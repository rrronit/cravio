import { Hono } from 'hono';
import type { AppEnv } from '../models/app.model';
import { listNotifications, readAllNotifications } from '../handlers/notification.handler';

export const notificationRoutes = new Hono<AppEnv>()
  .get('/', listNotifications)
  .put('/read-all', readAllNotifications);
