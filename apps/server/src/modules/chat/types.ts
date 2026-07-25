import { MessageType } from '@prisma/client';

export interface ISendMessageData {
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
}

export interface IEditMessageData {
  messageId: string;
  userId: string;
  content: string;
}

export interface IDeleteMessageData {
  messageId: string;
  userId: string;
  deleteForEveryone?: boolean;
}

export interface IAddReactionData {
  messageId: string;
  userId: string;
  emoji: string;
}

export interface IRemoveReactionData {
  messageId: string;
  userId: string;
  emoji: string;
}

export interface IMarkMessageReadData {
  messageId: string;
  userId: string;
}
