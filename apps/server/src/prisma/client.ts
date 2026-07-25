import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/logger/index.js';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export const checkDatabaseReady = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Database readiness check failed');
    return false;
  }
};

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
