/**
 * Group Calls Event Handlers
 * 
 * Handles cross-module event listening related to group calls.
 * Note: Event emissions currently happen directly after DB commits without an outbox pattern.
 * This is acceptable for Phase 10 but may result in lost events on server crashes (addressed in Phase 12).
 */
import { eventEmitter } from '../../events/emitter.js';
import { AppEvent } from '../../events/types.js';

export function registerGroupCallEventHandlers() {
  // Listen for USER_DELETED or MEMBER_LEFT to cleanup active call states if necessary.
  // For Phase 10, the service logic checks bans and memberships at join and start.
  // We can add a handler for MEMBER_LEFT to force-leave an active group call.

  eventEmitter.on('MEMBER_LEFT', async (_event: AppEvent) => {
    // Left group? We could automatically leave any active group call they are in.
    // To do this, we'd need to query groupCallRepository.
    // For Phase 10, we'll keep it simple and rely on client disconnection and socket state cleanup.
  });
}
