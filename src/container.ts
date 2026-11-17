import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';

import { GetCurrentUser } from './application/use-cases/auth/get-current-user';
import { LoginUser } from './application/use-cases/auth/login-user';
import { LogoutUser } from './application/use-cases/auth/logout-user';
import { RefreshSession } from './application/use-cases/auth/refresh-session';
import { RegisterUser } from './application/use-cases/auth/register-user';
import { SessionIssuer } from './application/use-cases/auth/session-issuer';
import { env, type Env } from './config/env';
import type { Role } from './domain/entities/user';
import type { ProjectRepository } from './domain/repositories/project.repository';
import type { RefreshTokenRepository } from './domain/repositories/refresh-token.repository';
import type { TaskRepository } from './domain/repositories/task.repository';
import type { UserRepository } from './domain/repositories/user.repository';
import type { HealthProbe } from './domain/services/health-probe';
import type { PasswordHasher } from './domain/services/password-hasher';
import type { TokenService } from './domain/services/token-service';
import { createPrismaClient } from './infrastructure/database/prisma-client';
import { PrismaHealthProbe } from './infrastructure/database/prisma-health-probe';
import { logger, type AppLogger } from './infrastructure/logging/logger';
import { PrismaProjectRepository } from './infrastructure/repositories/prisma-project.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaTaskRepository } from './infrastructure/repositories/prisma-task.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token-service';
import { AuthController } from './presentation/http/controllers/auth.controller';
import { authenticate } from './presentation/http/middlewares/authenticate';
import { authorize } from './presentation/http/middlewares/authorize';

export interface AuthSlice {
  readonly authController: AuthController;
  readonly authenticate: RequestHandler;
  readonly authorize: (...roles: Role[]) => RequestHandler;
}

export interface AuthSliceDependencies {
  readonly users: UserRepository;
  readonly refreshTokens: RefreshTokenRepository;
  readonly passwordHasher: PasswordHasher;
  readonly tokenService: TokenService;
}

/**
 * Builds the auth slice from ports only. Tests reuse it with in-memory fakes,
 * so the HTTP layer can be exercised without a database.
 */
export function buildAuthSlice(dependencies: AuthSliceDependencies): AuthSlice {
  const sessionIssuer = new SessionIssuer(dependencies.refreshTokens, dependencies.tokenService);

  const authController = new AuthController({
    registerUser: new RegisterUser(dependencies.users, dependencies.passwordHasher),
    loginUser: new LoginUser(dependencies.users, dependencies.passwordHasher, sessionIssuer),
    refreshSession: new RefreshSession(
      dependencies.users,
      dependencies.refreshTokens,
      sessionIssuer,
      dependencies.tokenService,
    ),
    logoutUser: new LogoutUser(dependencies.refreshTokens, dependencies.tokenService),
    getCurrentUser: new GetCurrentUser(dependencies.users),
  });

  return {
    authController,
    authenticate: authenticate(dependencies.tokenService),
    authorize,
  };
}

export interface AppContainer extends AuthSlice {
  readonly env: Env;
  readonly logger: AppLogger;
  readonly prisma: PrismaClient;
  readonly healthProbe: HealthProbe;
  readonly users: UserRepository;
  readonly projects: ProjectRepository;
  readonly tasks: TaskRepository;
  readonly refreshTokens: RefreshTokenRepository;
  readonly passwordHasher: PasswordHasher;
  readonly tokenService: TokenService;
}

/**
 * Composition root: the only place that knows how concrete implementations are
 * wired together (manual dependency injection).
 */
export function createContainer(): AppContainer {
  const prisma = createPrismaClient();
  const users = new PrismaUserRepository(prisma);
  const refreshTokens = new PrismaRefreshTokenRepository(prisma);
  const passwordHasher = new Argon2PasswordHasher();
  const tokenService = new JwtTokenService();

  return {
    env,
    logger,
    prisma,
    healthProbe: new PrismaHealthProbe(prisma),
    users,
    projects: new PrismaProjectRepository(prisma),
    tasks: new PrismaTaskRepository(prisma),
    refreshTokens,
    passwordHasher,
    tokenService,
    ...buildAuthSlice({ users, refreshTokens, passwordHasher, tokenService }),
  };
}
