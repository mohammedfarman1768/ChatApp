import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { env } from './shared/config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { authRouter } from './modules/auth/routes.js';
import { prisma } from './prisma/client.js';
import './modules/auth/passport.js';
import { setupSwagger } from './docs/swagger.js';
import { usersRouter } from './modules/users/routes.js';
import { registerUserEventHandlers } from './modules/users/eventHandlers.js';
import { chatRouter } from './modules/chat/routes.js';
import { registerChatEventHandlers } from './modules/chat/eventHandlers.js';
import { registerGroupEventHandlers } from './modules/groups/eventHandlers.js';
import { registerGroupMessageEventHandlers } from './modules/group-messages/eventHandlers.js';
import { groupsRouter } from './modules/groups/routes.js';
import groupMessagesRouter from './modules/group-messages/routes.js';
import { mediaRouter } from './modules/media/routes.js';
import { notificationsRouter } from './modules/notifications/routes.js';
import { registerNotificationEventHandlers } from './modules/notifications/eventHandlers.js';
import callsRouter from './modules/calls/routes.js';
import { registerCallEventHandlers } from './modules/calls/eventHandlers.js';
import { groupCallsRouter } from './modules/group-calls/routes.js';
import { registerGroupCallEventHandlers } from './modules/group-calls/eventHandlers.js';
import { searchRouter } from './modules/search/routes.js';
import { registerSearchEventHandlers } from './modules/search/eventHandlers.js';
import { aiRouter } from './modules/ai/routes.js';
import { registerAIEventHandlers } from './modules/ai/eventHandlers.js';
import { createServer } from 'http';
import { initSocketServer } from './realtime/socket.js';

// Initialize global event listeners
registerUserEventHandlers();
registerChatEventHandlers();
registerGroupEventHandlers();
registerGroupMessageEventHandlers();
registerNotificationEventHandlers();
registerCallEventHandlers();
registerGroupCallEventHandlers();
registerSearchEventHandlers();
registerAIEventHandlers();

async function bootstrap() {
  const app = express();
  
  app.set('trust proxy', 1);
  
  app.use(cors({
    origin: env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  
  app.use(passport.initialize());

  // Setup Swagger API docs
  setupSwagger(app);

  app.get('/health', (req, res) => { res.status(200).send('OK'); });
  app.get('/health/ready', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'healthy' });
    } catch (e) {
      res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/v1/groups', groupsRouter);
  app.use('/api/v1/group-messages', groupMessagesRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/notifications', notificationsRouter);
  app.use('/api/v1/calls', callsRouter);
  // Group calls is typically nested under groups conceptually, or top-level. 
  // Let's mount it to match the REST API `/api/v1/groups/:groupId/calls`
  // Actually, we'll just mount it at `/api/v1/groups/:groupId/calls`
  app.use('/api/v1/groups/:groupId/calls', groupCallsRouter);
  app.use('/api/v1/search', searchRouter);
  app.use('/api/v1/ai', aiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  const httpServer = createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

bootstrap().catch(console.error);
