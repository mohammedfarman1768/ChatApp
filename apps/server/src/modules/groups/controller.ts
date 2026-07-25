import { Request, Response, NextFunction } from 'express';
import { groupService } from './service.js';
import { GroupError } from './types.js';

export const groupController = {
  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const group = await groupService.createGroup({
        ...req.body,
        userId: authUser.userId
      }, req.headers['x-correlation-id'] as string);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const group = await groupService.getGroup(groupId, authUser.userId);
      res.json(group);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async updateGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const group = await groupService.updateGroup({
        groupId,
        userId: authUser.userId,
        ...req.body
      }, req.headers['x-correlation-id'] as string);
      res.json(group);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async deleteGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      await groupService.deleteGroup(groupId, authUser.userId, req.headers['x-correlation-id'] as string);
      res.status(204).send();
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const result = await groupService.getMembers(groupId, authUser.userId, limit, cursor);
      res.json(result);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async joinGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const member = await groupService.joinGroup({
        groupId,
        userId: authUser.userId,
        inviteCode: req.body.inviteCode
      }, req.headers['x-correlation-id'] as string);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async leaveGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      await groupService.leaveGroup(groupId, authUser.userId, req.headers['x-correlation-id'] as string);
      res.status(204).send();
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async kickMember(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId, userId } = req.params;
      await groupService.kickMember(groupId, userId, authUser.userId, req.headers['x-correlation-id'] as string);
      res.status(204).send();
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async promoteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId, userId } = req.params;
      const member = await groupService.promoteMember({
        groupId,
        targetUserId: userId,
        adminId: authUser.userId,
        role: req.body.role
      }, req.headers['x-correlation-id'] as string);
      res.json(member);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async transferOwnership(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const member = await groupService.transferOwnership({
        groupId,
        currentOwnerId: authUser.userId,
        newOwnerId: req.body.newOwnerId
      }, req.headers['x-correlation-id'] as string);
      res.json(member);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async banMember(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const ban = await groupService.banMember({
        groupId,
        adminId: authUser.userId,
        targetUserId: req.body.targetUserId,
        reason: req.body.reason
      }, req.headers['x-correlation-id'] as string);
      res.status(201).json(ban);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async unbanMember(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId, userId } = req.params;
      await groupService.unbanMember(groupId, userId, authUser.userId, req.headers['x-correlation-id'] as string);
      res.status(204).send();
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getBans(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const result = await groupService.getBans(groupId, authUser.userId, limit, cursor);
      res.json(result);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async createInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const invite = await groupService.createInvite({
        groupId,
        userId: authUser.userId,
        maxUses: req.body.maxUses,
        expiresInHours: req.body.expiresInHours
      }, req.headers['x-correlation-id'] as string);
      res.status(201).json(invite);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getInvites(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const invites = await groupService.getInvites(groupId, authUser.userId);
      res.json(invites);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async revokeInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { inviteCode } = req.params;
      const invite = await groupService.revokeInvite(inviteCode, authUser.userId, req.headers['x-correlation-id'] as string);
      res.json(invite);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async createJoinRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const request = await groupService.createJoinRequest({
        groupId,
        userId: authUser.userId
      }, req.headers['x-correlation-id'] as string);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async getJoinRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const result = await groupService.getJoinRequests(groupId, authUser.userId, limit, cursor);
      res.json(result);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  },

  async decideJoinRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = req.user as any;
      const { groupId, requestId } = req.params;
      const request = await groupService.decideJoinRequest({
        groupId,
        adminId: authUser.userId,
        requestId,
        status: req.body.status
      }, req.headers['x-correlation-id'] as string);
      res.json(request);
    } catch (error) {
      if (error instanceof GroupError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
};
