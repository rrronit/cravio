import type { AppContext } from '../models/app.model';
import { currentUserId, logApiStep } from '../lib/auth';
import { createServices } from '../services/container';

export async function listNotifications(c: AppContext) {
  logApiStep(c, 'notifications.list.query_started');
  const data = await createServices(c.env.DB).notifications.list(currentUserId(c));
  const unread = data.filter((notification) => !notification.read).length;
  logApiStep(c, 'notifications.list.query_completed', { resultCount: data.length, unreadCount: unread });
  return c.json({ data, total: data.length, unread });
}

export async function readAllNotifications(c: AppContext) {
  logApiStep(c, 'notifications.read_all.update_started');
  const updated = await createServices(c.env.DB).notifications.readAll(currentUserId(c));
  logApiStep(c, 'notifications.read_all.update_completed', { updatedCount: updated });
  return c.json({ updated });
}
