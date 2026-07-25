import { Request, Response, NextFunction } from 'express';
import { groupMessageService } from './service.js';
import { GroupMessageError } from './types.js';

export const groupMessageController = {
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const { limit, cursor } = req.query as { limit: string; cursor?: string };

      const result = await groupMessageService.getMessages(groupId, (req.user as any).userId, {
        limit: parseInt(limit, 10),
        cursor,
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const { content, replyToMessageId } = req.body;

      const message = await groupMessageService.sendMessage({
        groupId,
        senderId: (req.user as any).userId,
        content,
        replyToMessageId,
      });

      res.status(201).json({ status: 'success', data: message });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async editMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, messageId } = req.params;
      const { content } = req.body;

      const message = await groupMessageService.editMessage(groupId, (req.user as any).userId, {
        messageId,
        content,
      });

      res.status(200).json({ status: 'success', data: message });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, messageId } = req.params;
      // Default to deleting for me if not specified
      const deleteForEveryone = req.body.deleteForEveryone === true;

      await groupMessageService.deleteMessage(groupId, (req.user as any).userId, messageId, deleteForEveryone);

      res.status(200).json({ status: 'success', message: 'Message deleted' });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, messageId } = req.params;

      await groupMessageService.markAsRead(groupId, (req.user as any).userId, messageId);

      res.status(200).json({ status: 'success', message: 'Message marked as read' });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async addReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, messageId } = req.params;
      const { emoji } = req.body;

      await groupMessageService.addReaction(groupId, (req.user as any).userId, messageId, emoji);

      res.status(200).json({ status: 'success', message: 'Reaction added' });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async removeReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, messageId, emoji } = req.params;

      await groupMessageService.removeReaction(groupId, (req.user as any).userId, messageId, emoji);

      res.status(200).json({ status: 'success', message: 'Reaction removed' });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getPins(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;

      const pins = await groupMessageService.getPins(groupId, (req.user as any).userId);

      res.status(200).json({ status: 'success', data: pins });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async pinMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, messageId } = req.params;

      await groupMessageService.pinMessage(groupId, (req.user as any).userId, messageId);

      res.status(200).json({ status: 'success', message: 'Message pinned' });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async unpinMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId, messageId } = req.params;

      await groupMessageService.unpinMessage(groupId, (req.user as any).userId, messageId);

      res.status(200).json({ status: 'success', message: 'Message unpinned' });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const { limit, cursor } = req.query as { limit: string; cursor?: string };

      const result = await groupMessageService.getAnnouncements(groupId, (req.user as any).userId, {
        limit: parseInt(limit, 10),
        cursor,
      });

      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;
      const { messageId } = req.body;

      const announcement = await groupMessageService.createAnnouncement(groupId, (req.user as any).userId, messageId);

      res.status(201).json({ status: 'success', data: announcement });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.params;

      const meta = await groupMessageService.getMeta(groupId, (req.user as any).userId);

      res.status(200).json({ status: 'success', data: meta });
    } catch (error) {
      if (error instanceof GroupMessageError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
};
