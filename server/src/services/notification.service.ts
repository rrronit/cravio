import type { Notification } from '../models/notification.model';
import type { NotificationRepository } from '../repositories/notification.repository';

export const createNotificationService = (notifications: NotificationRepository) => ({
  list: (userId: string): Promise<Notification[]> => notifications.findAll(userId),
  readAll: (userId: string): Promise<number> => notifications.markAllRead(userId),
});

export type NotificationService = ReturnType<typeof createNotificationService>;
