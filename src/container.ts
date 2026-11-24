import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';

import { GetCurrentUser } from './application/use-cases/auth/get-current-user';
import { LoginUser } from './application/use-cases/auth/login-user';
import { LogoutUser } from './application/use-cases/auth/logout-user';
import { RefreshSession } from './application/use-cases/auth/refresh-session';
import { RegisterUser } from './application/use-cases/auth/register-user';
import { SessionIssuer } from './application/use-cases/auth/session-issuer';
import { CreateProject } from './application/use-cases/projects/create-project';
import { DeleteProject } from './application/use-cases/projects/delete-project';
import { GetProject } from './application/use-cases/projects/get-project';
import { ListProjects } from './application/use-cases/projects/list-projects';
import { UpdateProject } from './application/use-cases/projects/update-project';
import { ChangeTaskStatus } from './application/use-cases/tasks/change-task-status';
import { CreateTask } from './application/use-cases/tasks/create-task';
import { DeleteTask } from './application/use-cases/tasks/delete-task';
import { GetTask } from './application/use-cases/tasks/get-task';
import { ListTasks } from './application/use-cases/tasks/list-tasks';
import { UpdateTask } from './application/use-cases/tasks/update-task';
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
import { ProjectController } from './presentation/http/controllers/project.controller';
import { TaskController } from './presentation/http/controllers/task.controller';
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

export interface ProjectsTasksSlice {
  readonly projectController: ProjectController;
  readonly taskController: TaskController;
}

export interface ProjectsTasksSliceDependencies {
  readonly projects: ProjectRepository;
  readonly tasks: TaskRepository;
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

export function buildProjectsTasksSlice(
  dependencies: ProjectsTasksSliceDependencies,
): ProjectsTasksSlice {
  const projectController = new ProjectController({
    createProject: new CreateProject(dependencies.projects),
    listProjects: new ListProjects(dependencies.projects),
    getProject: new GetProject(dependencies.projects),
    updateProject: new UpdateProject(dependencies.projects),
    deleteProject: new DeleteProject(dependencies.projects),
  });

  const taskController = new TaskController({
    createTask: new CreateTask(dependencies.tasks, dependencies.projects),
    listTasks: new ListTasks(dependencies.tasks, dependencies.projects),
    getTask: new GetTask(dependencies.tasks, dependencies.projects),
    updateTask: new UpdateTask(dependencies.tasks, dependencies.projects),
    changeTaskStatus: new ChangeTaskStatus(dependencies.tasks, dependencies.projects),
    deleteTask: new DeleteTask(dependencies.tasks, dependencies.projects),
  });

  return { projectController, taskController };
}

export interface AppContainer extends AuthSlice, ProjectsTasksSlice {
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
  const projects = new PrismaProjectRepository(prisma);
  const tasks = new PrismaTaskRepository(prisma);
  const refreshTokens = new PrismaRefreshTokenRepository(prisma);
  const passwordHasher = new Argon2PasswordHasher();
  const tokenService = new JwtTokenService();

  return {
    env,
    logger,
    prisma,
    healthProbe: new PrismaHealthProbe(prisma),
    users,
    projects,
    tasks,
    refreshTokens,
    passwordHasher,
    tokenService,
    ...buildAuthSlice({ users, refreshTokens, passwordHasher, tokenService }),
    ...buildProjectsTasksSlice({ projects, tasks }),
  };
}
