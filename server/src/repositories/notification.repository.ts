import type { Notification, NotificationRow } from '../models/notification.model';

export const createNotificationRepository = (db: D1Database) => ({
  findAll: async (userId: string): Promise<Notification[]> => {
    const { results } = await db.prepare(`SELECT id,icon,title,body,is_read,created_at
      FROM notifications WHERE user_id = ? ORDER BY created_at DESC`).bind(userId).all<NotificationRow>();
    return results.map(mapNotification);
  },

  markAllRead: async (userId: string): Promise<number> => {
    const result = await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
      .bind(userId).run();
    return result.meta.changes ?? 0;
  },
});

export type NotificationRepository = ReturnType<typeof createNotificationRepository>;

const mapNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  icon: row.icon,
  title: row.title,
  body: row.body,
  read: Boolean(row.is_read),
  createdAt: row.created_at,
});
