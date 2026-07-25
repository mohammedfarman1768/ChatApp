import { EventEmitter } from 'events';
import { AppEvent } from './types.js';

class TypedEventEmitter extends EventEmitter {
  emitEvent(eventName: string, event: AppEvent): boolean {
    return this.emit(eventName, event);
  }

  onEvent(eventName: string, listener: (event: AppEvent) => void): this {
    return this.on(eventName, listener);
  }
}

export const eventEmitter = new TypedEventEmitter();
