import { GroupCallSession, GroupCallParticipant, GroupCallSignal, GroupCallSessionStatus } from '@prisma/client';

export type { GroupCallSession, GroupCallParticipant, GroupCallSignal };
export { GroupCallSessionStatus };

export interface GroupCallWithParticipants extends GroupCallSession {
  participants: GroupCallParticipant[];
}
