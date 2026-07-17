export type Notification = {
  id: string;
  icon: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type NotificationRow = {
  id: string;
  icon: string;
  title: string;
  body: string;
  is_read: number;
  created_at: string;
};
