import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../shared/logger/index.js';
import { registerChatSocketHandlers } from '../modules/chat/socket.js';
import { registerGroupSocketHandlers } from '../modules/groups/socket.js';
import { setupGroupMessagingSocket } from '../modules/group-messages/socket.js';
import { initNotificationSocket } from '../modules/notifications/socket.js';
import { initCallSocket } from '../modules/calls/socket.js';
import { initGroupCallSocket } from '../modules/group-calls/socket.js';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // We'll restrict this in future phases
    },
  });

  initNotificationSocket(io);
  initCallSocket(io);
  initGroupCallSocket(io);

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected to socket');
    
    // Register module-specific handlers
    registerChatSocketHandlers(socket);
    registerGroupSocketHandlers(socket);
    setupGroupMessagingSocket(io!, socket);

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected from socket');
    });
  });

  return io;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const isSocketReady = () => {
  return io !== null;
};
