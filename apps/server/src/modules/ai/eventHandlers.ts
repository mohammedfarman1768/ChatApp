import { eventEmitter } from '../../events/emitter.js';
import { aiService } from './service.js';

// Currently AI features in Phase 12 are primarily driven via HTTP endpoints.
// We can add async event handlers here in the future if we want automatic moderation or summary generation based on events.
export const registerAIEventHandlers = () => {
  // e.g. eventEmitter.on('GROUP_CREATED', async (payload) => { ... });
};
