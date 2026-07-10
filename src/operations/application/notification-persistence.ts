export type NotificationRecord = {
  id: string;
  recipientId: string;
  type: string;
  channel: string;
  status: string;
  message: string;
  createdAt: Date;
};

export interface NotificationRepository {
  save(notification: NotificationRecord): Promise<void>;
  findById(id: string): Promise<NotificationRecord | null>;
  findByRecipient(recipientId: string): Promise<NotificationRecord[]>;
}
