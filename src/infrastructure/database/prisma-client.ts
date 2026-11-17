import { PrismaClient } from '@prisma/client';

import { env } from '../../config/env';

/**
 * A single Prisma client per process. It connects lazily on the first query,
 * which keeps the app bootable (and `/health` reachable) when the database is down.
 */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}
