import { Request, Response, NextFunction } from 'express';
import { groupCallService } from './service.js';
import { 
  CreateGroupCallInput, 
  GroupCallJoinInput, 
  GroupCallActionInput,
  GroupCallSignalInput,
} from '@repo/shared-validation';

export const groupCallController = {
  async initiateCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const input = req.body as CreateGroupCallInput;
      // Inject groupId from path if needed, though validation schema ensures it
      input.groupId = req.params.groupId;

      const call = await groupCallService.initiateCall(userId, input);
      res.status(201).json(call);
    } catch (error) {
      next(error);
    }
  },

  async joinCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const input = req.body as GroupCallJoinInput;
      input.groupId = req.params.groupId;
      input.callId = req.params.callId;

      const call = await groupCallService.joinCall(userId, input);
      res.status(200).json(call);
    } catch (error) {
      next(error);
    }
  },

  async leaveCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { groupId, callId } = req.params as unknown as GroupCallActionInput;

      const call = await groupCallService.leaveCall(userId, groupId, callId);
      res.status(200).json(call);
    } catch (error) {
      next(error);
    }
  },

  async endCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { groupId, callId } = req.params as unknown as GroupCallActionInput;

      const call = await groupCallService.endCall(userId, groupId, callId);
      res.status(200).json(call);
    } catch (error) {
      next(error);
    }
  },

  async cancelCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { groupId, callId } = req.params as unknown as GroupCallActionInput;

      const call = await groupCallService.cancelCall(userId, groupId, callId);
      res.status(200).json(call);
    } catch (error) {
      next(error);
    }
  },

  async getRecentCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { groupId } = req.params;
      const limit = Number(req.query.limit) || 20;
      const cursor = req.query.cursor as string | undefined;

      const result = await groupCallService.getRecentCalls(userId, groupId, limit, cursor);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getActiveCall(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { groupId } = req.params;

      const call = await groupCallService.getActiveCall(userId, groupId);
      res.status(200).json(call || null);
    } catch (error) {
      next(error);
    }
  },

  async getCallDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { groupId, callId } = req.params as unknown as GroupCallActionInput;

      const call = await groupCallService.getCallDetails(userId, groupId, callId);
      res.status(200).json(call);
    } catch (error) {
      next(error);
    }
  },

  async persistSignal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).userId;
      const { groupId, callId } = req.params as unknown as GroupCallActionInput;
      const input = req.body as GroupCallSignalInput;

      const signal = await groupCallService.persistSignal(userId, groupId, callId, input.type, input.payload);
      res.status(201).json(signal);
    } catch (error) {
      next(error);
    }
  }
};
