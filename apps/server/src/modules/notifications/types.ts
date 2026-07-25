export class NotificationError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'NotificationError';
  }
}

export interface CreateNotificationDTO {
  userId: string;
  actorId?: string;
  category: 'SYSTEM' | 'SOCIAL' | 'CHAT' | 'GROUP' | 'SECURITY' | 'MEDIA';
  type: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  title: string;
  body: string;
  actionUrl?: string;
  entityId?: string;
  entityType?: string;
  metadata?: any;
  expiresAt?: Date;
}
