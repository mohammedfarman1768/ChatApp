import { initGroupCallSocket } from '../socket';
import { groupRepository } from '../../groups/repository';
import { groupCallRepository } from '../repository';
import { Server } from 'socket.io';

jest.mock('../../groups/repository');
jest.mock('../repository');

describe('Group Call Socket Handlers', () => {
  let mockIo: Partial<Server>;
  let mockSocket: any;
  let connectionHandler: (socket: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSocket = {
      data: { userId: 'user-1' },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      on: jest.fn()
    };

    mockIo = {
      on: jest.fn((_event, handler) => {
        if (_event === 'connection') {
          connectionHandler = handler;
        }
        return mockIo as Server;
      })
    };

    initGroupCallSocket(mockIo as Server);
  });

  describe('group-call:join', () => {
    it('should join the socket room if user is a participant and not banned', async () => {
      connectionHandler(mockSocket);
      
      const joinHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'group-call:join')[1];
      
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: 'user-1' });
      (groupRepository.getBan as jest.Mock).mockResolvedValue(null);
      (groupCallRepository.getParticipant as jest.Mock).mockResolvedValue({ userId: 'user-1' });

      await joinHandler({ groupId: 'group-1', callId: 'call-1' });

      expect(mockSocket.join).toHaveBeenCalledWith('group-call:group-1:call-1');
      expect(mockSocket.to).toHaveBeenCalledWith('group-call:group-1:call-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('group-call:joined', { userId: 'user-1', groupId: 'group-1', callId: 'call-1' });
    });

    it('should emit error if user is banned', async () => {
      connectionHandler(mockSocket);
      
      const joinHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'group-call:join')[1];
      
      (groupRepository.getMember as jest.Mock).mockResolvedValue({ userId: 'user-1' });
      (groupRepository.getBan as jest.Mock).mockResolvedValue({ reason: 'spam' });

      await joinHandler({ groupId: 'group-1', callId: 'call-1' });

      expect(mockSocket.emit).toHaveBeenCalledWith('group-call:error', { message: 'Unauthorized' });
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('group-call:leave', () => {
    it('should leave room and emit left event if participant', async () => {
      connectionHandler(mockSocket);
      const leaveHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'group-call:leave')[1];

      (groupCallRepository.getParticipant as jest.Mock).mockResolvedValue({ userId: 'user-1' });

      await leaveHandler({ groupId: 'group-1', callId: 'call-1' });

      expect(mockSocket.leave).toHaveBeenCalledWith('group-call:group-1:call-1');
      expect(mockSocket.to).toHaveBeenCalledWith('group-call:group-1:call-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('group-call:left', { userId: 'user-1', groupId: 'group-1', callId: 'call-1' });
    });

    it('should silently ignore if not a participant', async () => {
      connectionHandler(mockSocket);
      const leaveHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'group-call:leave')[1];

      (groupCallRepository.getParticipant as jest.Mock).mockResolvedValue(null);

      await leaveHandler({ groupId: 'group-1', callId: 'call-1' });

      expect(mockSocket.leave).not.toHaveBeenCalled();
    });
  });
});
