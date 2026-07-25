import { groupCallService } from '../service';
import { groupCallRepository } from '../repository';
import { groupRepository } from '../../groups/repository';
import { eventEmitter } from '../../../events/emitter';
import { AppError } from '../../../shared/errors/index';
import { GroupCallSessionStatus } from '../types';

jest.mock('../repository');
jest.mock('../../groups/repository');
jest.mock('../../../events/emitter');

describe('Group Call Service Unit Tests', () => {
  const mockUserId = 'user-1';
  const mockGroupId = 'group-1';
  const mockCallId = 'call-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateCall', () => {
    it('should successfully initiate a group call', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: mockUserId, groupId: mockGroupId });
      (groupRepository.getBan as jest.Mock).mockResolvedValue(null);
      (groupRepository.getGroupById as jest.Mock).mockResolvedValue({ settings: { allowGroupCalls: true } });
      (groupCallRepository.getActiveCallForGroup as jest.Mock).mockResolvedValue(null);
      
      const mockCreatedCall = {
        id: mockCallId,
        groupId: mockGroupId,
        startedBy: mockUserId,
        status: GroupCallSessionStatus.RINGING,
        participants: []
      };
      
      (groupCallRepository.createCall as jest.Mock).mockResolvedValue(mockCreatedCall);

      const call = await groupCallService.initiateCall(mockUserId, { groupId: mockGroupId });

      expect(call).toEqual(mockCreatedCall);
      expect(groupCallRepository.createCall).toHaveBeenCalled();
      expect(eventEmitter.emitEvent).toHaveBeenCalledTimes(2); // STARTED and RINGING
    });

    it('should throw AppError if user is not a member', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue(null);

      await expect(groupCallService.initiateCall(mockUserId, { groupId: mockGroupId }))
        .rejects.toThrow(new AppError('Not a member of this group', 403));
    });

    it('should throw AppError if user is banned', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: mockUserId, groupId: mockGroupId });
      (groupRepository.getBan as jest.Mock).mockResolvedValue({ reason: 'spam' });

      await expect(groupCallService.initiateCall(mockUserId, { groupId: mockGroupId }))
        .rejects.toThrow(new AppError('You are banned from this group', 403));
    });
  });

  describe('joinCall', () => {
    it('should prevent joining if participant limit is reached', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: mockUserId, groupId: mockGroupId });
      (groupRepository.getBan as jest.Mock).mockResolvedValue(null);
      
      const mockCall = {
        id: mockCallId,
        groupId: mockGroupId,
        status: GroupCallSessionStatus.ACTIVE
      };
      
      (groupCallRepository.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (groupCallRepository.getActiveParticipantsCount as jest.Mock).mockResolvedValue(25);
      (groupCallRepository.getParticipant as jest.Mock).mockResolvedValue(null); // Not already joined

      await expect(groupCallService.joinCall(mockUserId, { groupId: mockGroupId, callId: mockCallId }))
        .rejects.toThrow(new AppError('Participant limit reached (25)', 403));
    });

    it('should transition to ACTIVE if ringing when second user joins', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: mockUserId, groupId: mockGroupId });
      (groupRepository.getBan as jest.Mock).mockResolvedValue(null);
      
      const mockCall = {
        id: mockCallId,
        groupId: mockGroupId,
        status: GroupCallSessionStatus.RINGING
      };
      
      (groupCallRepository.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (groupCallRepository.getActiveParticipantsCount as jest.Mock).mockResolvedValue(1);
      (groupCallRepository.getParticipant as jest.Mock).mockResolvedValue(null);
      (groupCallRepository.addParticipant as jest.Mock).mockResolvedValue({});

      await groupCallService.joinCall(mockUserId, { groupId: mockGroupId, callId: mockCallId });

      expect(groupCallRepository.updateCallStatus).toHaveBeenCalledWith(mockCallId, GroupCallSessionStatus.ACTIVE);
    });
  });

  describe('Ring Timeout', () => {
    it('should transition RINGING call to MISSED if expired', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: mockUserId, groupId: mockGroupId });
      
      const expiredCall = {
        id: mockCallId,
        groupId: mockGroupId,
        status: GroupCallSessionStatus.RINGING,
        ringExpiresAt: new Date(Date.now() - 10000) // 10s ago
      };

      (groupCallRepository.getActiveCallForGroup as jest.Mock).mockResolvedValue(expiredCall);
      (groupCallRepository.updateCallStatus as jest.Mock).mockResolvedValue({
        ...expiredCall,
        status: GroupCallSessionStatus.MISSED
      });

      const activeCall = await groupCallService.getActiveCall(mockUserId, mockGroupId);
      
      expect(activeCall).toBeNull(); // Should return null because it's no longer active
      expect(groupCallRepository.updateCallStatus).toHaveBeenCalledWith(mockCallId, GroupCallSessionStatus.MISSED, expect.any(Object));
      expect(eventEmitter.emitEvent).toHaveBeenCalledWith('GROUP_CALL_MISSED', expect.any(Object));
    });

    it('should remain RINGING if not expired', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: mockUserId, groupId: mockGroupId });
      
      const ringingCall = {
        id: mockCallId,
        groupId: mockGroupId,
        status: GroupCallSessionStatus.RINGING,
        ringExpiresAt: new Date(Date.now() + 10000) // 10s from now
      };

      (groupCallRepository.getActiveCallForGroup as jest.Mock).mockResolvedValue(ringingCall);

      const activeCall = await groupCallService.getActiveCall(mockUserId, mockGroupId);
      
      expect(activeCall).toEqual(ringingCall);
      expect(groupCallRepository.updateCallStatus).not.toHaveBeenCalled();
    });
  });

  describe('endCall', () => {
    it('should throw AppError if user lacks permissions', async () => {
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: mockUserId, groupId: mockGroupId, role: 'MEMBER' });
      
      const mockCall = {
        id: mockCallId,
        groupId: mockGroupId,
        status: GroupCallSessionStatus.ACTIVE,
        startedBy: 'different-user'
      };
      
      (groupCallRepository.getCallById as jest.Mock).mockResolvedValue(mockCall);

      await expect(groupCallService.endCall(mockUserId, mockGroupId, mockCallId))
        .rejects.toThrow(new AppError('Not authorized to end this call', 403));
    });
  });
});
