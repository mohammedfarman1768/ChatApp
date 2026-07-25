import { Request, Response } from 'express';
import { callService } from './service.js';
import { CreateCallInput, CallActionInput, CallSignalInput, CallPaginationInput } from '@repo/shared-validation';
import { AppError } from '../../shared/errors/index.js';

export const callController = {
  async initiateCall(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const input = req.body as CreateCallInput;
    const call = await callService.initiateCall(userId, input);
    res.status(201).json({ status: 'success', data: call });
  },

  async acceptCall(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const { callId } = req.params;
    const call = await callService.acceptCall(userId, callId);
    res.status(200).json({ status: 'success', data: call });
  },

  async rejectCall(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const { callId } = req.params;
    const call = await callService.rejectCall(userId, callId);
    res.status(200).json({ status: 'success', data: call });
  },

  async cancelCall(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const { callId } = req.params;
    const call = await callService.cancelCall(userId, callId);
    res.status(200).json({ status: 'success', data: call });
  },

  async endCall(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const { callId } = req.params;
    const call = await callService.endCall(userId, callId);
    res.status(200).json({ status: 'success', data: call });
  },

  async persistSignal(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const { callId } = req.params;
    const { type, payload } = req.body as CallSignalInput;
    const signal = await callService.persistSignal(userId, callId, type, payload);
    res.status(201).json({ status: 'success', data: signal });
  },

  async getRecentCalls(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const { cursor, limit } = req.query as unknown as CallPaginationInput;
    const calls = await callService.getRecentCalls(userId, limit ?? 20, cursor);
    
    let nextCursor: string | undefined = undefined;
    if (calls.length > (limit ?? 20)) {
      const nextItem = calls.pop();
      nextCursor = nextItem?.id;
    }

    res.status(200).json({ 
      status: 'success', 
      data: { calls, nextCursor } 
    });
  },

  async getCallDetails(req: Request, res: Response) {
    const userId = (req.user as any).userId;
    const { callId } = req.params;
    const call = await callService.getCallDetails(userId, callId);
    res.status(200).json({ status: 'success', data: call });
  }
};
