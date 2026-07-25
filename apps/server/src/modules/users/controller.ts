import { Request, Response } from 'express';
import { usersService } from './service.js';
import { 
  UpdateProfileSchema, 
  UpdatePrivacySchema, 
  SendFriendRequestSchema, 
  AddContactSchema, 
  BlockUserSchema,
  SearchUsersSchema,
  PaginationSchema
} from '@repo/shared-validation';
import { z } from 'zod';

export class UsersController {
  async getMyProfile(req: Request, res: Response) {
    try {
      const profile = await usersService.getMyProfile(req.user!.userId);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateMyProfile(req: Request, res: Response) {
    try {
      const data = UpdateProfileSchema.parse({ body: req.body }).body;
      const updated = await usersService.updateMyProfile(req.user!.userId, data);
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      if (error.code === 'P2002') return res.status(409).json({ message: 'Username already taken' });
      res.status(500).json({ message: error.message });
    }
  }

  async updateMyPrivacy(req: Request, res: Response) {
    try {
      const data = UpdatePrivacySchema.parse({ body: req.body }).body;
      const updated = await usersService.updateMyPrivacy(req.user!.userId, data);
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: error.message });
    }
  }

  async searchUsers(req: Request, res: Response) {
    try {
      const { query } = SearchUsersSchema.parse({ query: req.query });
      const results = await usersService.searchUsers(query.query, req.user!.userId, query.cursor, query.limit);
      res.json(results);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: error.message });
    }
  }

  async getUserProfile(req: Request, res: Response) {
    try {
      const username = req.params.username;
      const profile = await usersService.getUserProfile(username, req.user!.userId);
      if (!profile) return res.status(404).json({ message: 'User not found' });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async sendFriendRequest(req: Request, res: Response) {
    try {
      const data = SendFriendRequestSchema.parse({ body: req.body }).body;
      const result = await usersService.sendFriendRequest(req.user!.userId, data.receiverId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      if (error.message === 'Cannot send request to yourself' || error.message === 'Already friends' || error.message === 'Request already pending') {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === 'Cannot send friend request' || error.message === 'Receiver not found') {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  async acceptFriendRequest(req: Request, res: Response) {
    try {
      const result = await usersService.acceptFriendRequest(req.user!.userId, req.params.id);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Unauthorized') return res.status(403).json({ message: error.message });
      if (error.message === 'Request not pending') return res.status(400).json({ message: error.message });
      if (error.message === 'Request not found') return res.status(404).json({ message: error.message });
      res.status(500).json({ message: error.message });
    }
  }

  async rejectFriendRequest(req: Request, res: Response) {
    try {
      const result = await usersService.rejectFriendRequest(req.user!.userId, req.params.id);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Unauthorized') return res.status(403).json({ message: error.message });
      if (error.message === 'Request not pending') return res.status(400).json({ message: error.message });
      if (error.message === 'Request not found') return res.status(404).json({ message: error.message });
      res.status(500).json({ message: error.message });
    }
  }

  async cancelFriendRequest(req: Request, res: Response) {
    try {
      const result = await usersService.cancelFriendRequest(req.user!.userId, req.params.id);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Unauthorized') return res.status(403).json({ message: error.message });
      if (error.message === 'Request not pending') return res.status(400).json({ message: error.message });
      if (error.message === 'Request not found') return res.status(404).json({ message: error.message });
      res.status(500).json({ message: error.message });
    }
  }

  async getPendingRequests(req: Request, res: Response) {
    try {
      const { query } = PaginationSchema.parse({ query: req.query });
      const result = await usersService.getPendingRequests(req.user!.userId, query.cursor, query.limit);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: error.message });
    }
  }

  async getFriends(req: Request, res: Response) {
    try {
      const { query } = PaginationSchema.parse({ query: req.query });
      const result = await usersService.getFriends(req.user!.userId, query.cursor, query.limit);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: error.message });
    }
  }

  async removeFriend(req: Request, res: Response) {
    try {
      const result = await usersService.removeFriend(req.user!.userId, req.params.friendId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getContacts(req: Request, res: Response) {
    try {
      const { query } = PaginationSchema.parse({ query: req.query });
      const result = await usersService.getContacts(req.user!.userId, query.cursor, query.limit);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      res.status(500).json({ message: error.message });
    }
  }

  async addContact(req: Request, res: Response) {
    try {
      const data = AddContactSchema.parse({ body: req.body }).body;
      const result = await usersService.addContact(req.user!.userId, data.contactUserId, data.alias);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      if (error.message === 'User not found') return res.status(404).json({ message: error.message });
      if (error.message === 'Cannot add yourself as contact') return res.status(400).json({ message: error.message });
      res.status(500).json({ message: error.message });
    }
  }

  async removeContact(req: Request, res: Response) {
    try {
      const result = await usersService.removeContact(req.user!.userId, req.params.contactUserId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async blockUser(req: Request, res: Response) {
    try {
      const data = BlockUserSchema.parse({ body: req.body }).body;
      const result = await usersService.blockUser(req.user!.userId, data.blockedId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
      if (error.message === 'User not found') return res.status(404).json({ message: error.message });
      if (error.message === 'Cannot block yourself') return res.status(400).json({ message: error.message });
      res.status(500).json({ message: error.message });
    }
  }

  async unblockUser(req: Request, res: Response) {
    try {
      const result = await usersService.unblockUser(req.user!.userId, req.params.blockedId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export const usersController = new UsersController();
