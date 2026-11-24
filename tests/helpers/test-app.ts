import { randomUUID } from 'node:crypto';

import { buildAuthSlice, buildProjectsTasksSlice, createContainer, type AppContainer } from '../../src/container';
import { Role } from '../../src/domain/entities/user';
import { createApp } from '../../src/app';
import { FakePasswordHasher } from '../fakes/fake-password-hasher';
import { FakeTokenService } from '../fakes/fake-token-service';
import { InMemoryProjectRepository } from '../fakes/in-memory-project.repository';
import { InMemoryRefreshTokenRepository } from '../fakes/in-memory-refresh-token.repository';
import { InMemoryTaskRepository } from '../fakes/in-memory-task.repository';
import { InMemoryUserRepository } from '../fakes/in-memory-user.repository';

export interface TestApp {
  app: ReturnType<typeof createApp>;
  container: AppContainer;
  users: InMemoryUserRepository;
  projects: InMemoryProjectRepository;
  tasks: InMemoryTaskRepository;
  refreshTokens: InMemoryRefreshTokenRepository;
  issueToken(role?: Role): { token: string; userId: string };
}

/** Full HTTP stack with in-memory adapters, so endpoint tests need no database. */
export function createTestApp(): TestApp {
  const base = createContainer();
  const users = new InMemoryUserRepository();
  const projects = new InMemoryProjectRepository();
  const tasks = new InMemoryTaskRepository();
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();

  const container: AppContainer = {
    ...base,
    users,
    projects,
    tasks,
    refreshTokens,
    passwordHasher,
    tokenService,
    ...buildAuthSlice({ users, refreshTokens, passwordHasher, tokenService }),
    ...buildProjectsTasksSlice({ projects, tasks }),
  };

  return {
    app: createApp(container),
    container,
    users,
    projects,
    tasks,
    refreshTokens,
    issueToken(role: Role = Role.USER): { token: string; userId: string } {
      const userId = randomUUID();
      const { token } = tokenService.issueAccessToken({ userId, role });

      return { token, userId };
    },
  };
}
