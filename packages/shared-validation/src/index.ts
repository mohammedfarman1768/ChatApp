import { z } from 'zod';

// Export schemas and types from here
export * from './auth/index.js';
export * from './users/index.js';
export * from './chat/index.js';
export * from './groups/index.js';
export * from './group-messages/index.js';
export * from './media/index.js';
export * from './notifications/index.js';
export * from './calls/index.js';
export * from './group-calls/index.js';

export const EmptySchema = z.object({});
