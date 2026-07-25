import { eventEmitter } from '../../events/emitter.js';
import { AppEvent, UserRegisteredPayload } from '../../events/types.js';
import { usersService } from './service.js';

export function registerUserEventHandlers() {
  eventEmitter.onEvent('USER_REGISTERED', async (event: AppEvent) => {
    try {
      const payload = event.payload as UserRegisteredPayload;
      // Idempotently ensure the profile exists
      await usersService.ensureProfile(payload.userId, payload.email, payload.name, payload.avatarUrl);
    } catch (error) {
      console.error('Failed to handle USER_REGISTERED event in users module:', error);
    }
  });
}
