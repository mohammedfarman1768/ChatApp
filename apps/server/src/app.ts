import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { logger } from './shared/logger/index.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { checkDatabaseReady } from './prisma/client.js';
import { isSocketReady } from './realtime/socket.js';
import { authRouter } from './modules/auth/routes.js';
import './modules/auth/passport.js'; // Initialize passport strategies
import { csrfErrorHandler } from './middleware/csrf.js';
import { setupSwagger } from './docs/swagger.js';

export const createApp = () => {
  const app = express();

  setupSwagger(app);


  // Middleware
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(requestIdMiddleware);
  
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers['x-request-id'] as string) || 'unknown',
    })
  );

  // Health and Readiness Checks
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/health/ready', async (req, res) => {
    const dbReady = await checkDatabaseReady();
    const socketReady = isSocketReady();
    
    // In Phase 1, we don't have the Redis client implemented yet, but we will add it.
    // Assuming redis is okay if we can start up for now. We can add a real redis check later.
    const isReady = dbReady && socketReady;

    if (!isReady) {
      res.status(503).json({
        status: 'not ready',
        dependencies: {
          database: dbReady ? 'ok' : 'failed',
          socket: socketReady ? 'ok' : 'failed',
        },
      });
      return;
    }

    res.json({
      status: 'ready',
      dependencies: {
        database: 'ok',
        socket: 'ok',
      },
    });
  });

  // Mount Modules
  app.use('/api/v1/auth', authRouter);

  // 404 and Error Handling
  app.use(notFoundHandler);
  app.use(csrfErrorHandler);
  app.use(errorHandler);

  return app;
};
