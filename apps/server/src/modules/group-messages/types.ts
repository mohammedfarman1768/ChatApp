import { GroupMessageType } from '@prisma/client';

export class GroupMessageError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'GroupMessageError';
  }
}

export interface ISendGroupMessageData {
  groupId: string;
  senderId: string;
  content: string;
  replyToMessageId?: string;
  messageType?: GroupMessageType;
}

export interface IEditGroupMessageData {
  messageId: string;
  content: string;
}

export interface IGroupMessagePagination {
  limit: number;
  cursor?: string;
}

export interface IGroupAnnouncementData {
  groupId: string;
  createdBy: string;
  messageId: string;
}
