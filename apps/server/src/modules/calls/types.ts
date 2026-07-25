import { CallSession, CallParticipant, CallSignal, CallSessionStatus } from '@prisma/client';

export type { CallSession, CallParticipant, CallSignal };
export { CallSessionStatus };

export interface CallWithParticipants extends CallSession {
  participants: CallParticipant[];
}

export interface RecentCallsFilters {
  cursor?: string;
  limit?: number;
}
