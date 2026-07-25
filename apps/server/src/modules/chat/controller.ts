import { Request, Response, NextFunction } from 'express';
import { chatService } from './service.js';
import { 
  ChatPaginationSchema, 
  ConversationSchema, 
  SendMessageSchema, 
  EditMessageSchema, 
  DeleteMessageSchema, 
  ReactionSchema 
} from '@repo/shared-validation';

export const chatController = {
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { limit, cursor } = ChatPaginationSchema.parse(req.query);

      const result = await chatService.getConversations(authUser.userId, limit, cursor);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { conversationId } = req.params;
      
      const conversation = await chatService.getConversation(conversationId, authUser.userId);
      
      res.json(conversation);
    } catch (error) {
      next(error);
    }
  },

  async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { participantId } = ConversationSchema.parse(req.body);

      const conversation = await chatService.getOrCreateConversation(authUser.userId, participantId);
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { conversationId } = req.params;
      const { limit, cursor } = ChatPaginationSchema.parse(req.query);

      const result = await chatService.getMessages(conversationId, authUser.userId, limit, cursor);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { conversationId } = req.params;
      const data = SendMessageSchema.parse(req.body);

      const message = await chatService.sendMessage({
        conversationId,
        senderId: authUser.userId,
        content: data.content,
        messageType: data.messageType as any
      });
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  },

  async editMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { messageId } = req.params;
      const data = EditMessageSchema.parse(req.body);

      const message = await chatService.editMessage({
        messageId,
        userId: authUser.userId,
        content: data.content
      });
      res.json(message);
    } catch (error) {
      next(error);
    }
  },

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { messageId } = req.params;
      const data = DeleteMessageSchema.parse(req.body);

      const message = await chatService.deleteMessage({
        messageId,
        userId: authUser.userId,
        deleteForEveryone: data.deleteForEveryone
      });
      res.json(message);
    } catch (error) {
      next(error);
    }
  },

  async markMessageRead(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { messageId } = req.params;

      const status = await chatService.markMessageRead({
        messageId,
        userId: authUser.userId
      });
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  async addReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { messageId } = req.params;
      const data = ReactionSchema.parse(req.body);

      const reaction = await chatService.addReaction({
        messageId,
        userId: authUser.userId,
        emoji: data.emoji
      });
      res.status(201).json(reaction);
    } catch (error) {
      next(error);
    }
  },

  async removeReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { messageId, emoji } = req.params;

      await chatService.removeReaction({
        messageId,
        userId: authUser.userId,
        emoji
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
