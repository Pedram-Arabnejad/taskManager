import type { PrismaClient } from '@prisma/client';

import { env, type Env } from './config/env';
import type { ProjectRepository } from './domain/repositories/project.repository';
import type { RefreshTokenRepository } from './domain/repositories/refresh-token.repository';
import type { TaskRepository } from './domain/repositories/task.repository';
import type { UserRepository } from './domain/repositories/user.repository';
import type { HealthProbe } from './domain/services/health-probe';
import { createPrismaClient } from './infrastructure/database/prisma-client';
import { PrismaHealthProbe } from './infrastructure/database/prisma-health-probe';
import { logger, type AppLogger } from './infrastructure/logging/logger';
import { PrismaProjectRepository } from './infrastructure/repositories/prisma-project.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaTaskRepository } from './infrastructure/repositories/prisma-task.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';

/**
 * Composition root. This is the only place that knows how concrete
 * implementations are wired together (manual dependency injection).
 * Use cases, controllers and the HTTP app receive their collaborators from here.
 */
export interface AppContainer {
  readonly env: Env;
  readonly logger: AppLogger;
  readonly prisma: PrismaClient;
  readonly healthProbe: HealthProbe;
  readonly users: UserRepository;
  readonly projects: ProjectRepository;
  readonly tasks: TaskRepository;
  readonly refreshTokens: RefreshTokenRepository;
}

export function createContainer(): AppContainer {
  const prisma = createPrismaClient();

  return {
    env,
    logger,
    prisma,
    healthProbe: new PrismaHealthProbe(prisma),
    users: new PrismaUserRepository(prisma),
    projects: new PrismaProjectRepository(prisma),
    tasks: new PrismaTaskRepository(prisma),
    refreshTokens: new PrismaRefreshTokenRepository(prisma),
  };
}
