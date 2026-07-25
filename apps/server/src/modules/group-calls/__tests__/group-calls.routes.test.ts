import { Request, Response } from 'express';
import { groupCallController } from '../controller';
import { groupCallService } from '../service';

jest.mock('../service');

describe('Group Call Controller API Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      user: { userId: 'user-1' } as any,
      params: { groupId: 'group-1', callId: 'call-1' },
      body: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('initiateCall', () => {
    it('should return 201 on success', async () => {
      mockReq.body = { hasAudio: true };
      
      const mockCall = { id: 'call-1', status: 'RINGING' };
      (groupCallService.initiateCall as jest.Mock).mockResolvedValue(mockCall);

      await groupCallController.initiateCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockCall);
      expect(groupCallService.initiateCall).toHaveBeenCalledWith('user-1', {
        groupId: 'group-1',
        hasAudio: true
      });
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Test Error');
      (groupCallService.initiateCall as jest.Mock).mockRejectedValue(error);

      await groupCallController.initiateCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('joinCall', () => {
    it('should return 200 on success', async () => {
      const mockCall = { id: 'call-1', status: 'ACTIVE' };
      (groupCallService.joinCall as jest.Mock).mockResolvedValue(mockCall);

      await groupCallController.joinCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockCall);
    });
  });

  describe('endCall', () => {
    it('should return 200 on success', async () => {
      const mockCall = { id: 'call-1', status: 'ENDED' };
      (groupCallService.endCall as jest.Mock).mockResolvedValue(mockCall);

      await groupCallController.endCall(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockCall);
    });
  });
});
