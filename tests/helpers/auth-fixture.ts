import { GetCurrentUser } from '../../src/application/use-cases/auth/get-current-user';
import { LoginUser } from '../../src/application/use-cases/auth/login-user';
import { LogoutUser } from '../../src/application/use-cases/auth/logout-user';
import { RefreshSession } from '../../src/application/use-cases/auth/refresh-session';
import { RegisterUser } from '../../src/application/use-cases/auth/register-user';
import { SessionIssuer } from '../../src/application/use-cases/auth/session-issuer';
import type { RefreshTokenRepository } from '../../src/domain/repositories/refresh-token.repository';
import type { UserRepository } from '../../src/domain/repositories/user.repository';
import { FakePasswordHasher } from '../fakes/fake-password-hasher';
import { FakeTokenService } from '../fakes/fake-token-service';
import { InMemoryRefreshTokenRepository } from '../fakes/in-memory-refresh-token.repository';
import { InMemoryUserRepository } from '../fakes/in-memory-user.repository';

export interface AuthFixture {
  users: InMemoryUserRepository & UserRepository;
  refreshTokens: InMemoryRefreshTokenRepository & RefreshTokenRepository;
  passwordHasher: FakePasswordHasher;
  tokenService: FakeTokenService;
  registerUser: RegisterUser;
  loginUser: LoginUser;
  refreshSession: RefreshSession;
  logoutUser: LogoutUser;
  getCurrentUser: GetCurrentUser;
}

export const VALID_REGISTRATION = {
  email: 'ali@example.com',
  password: 'Passw0rd!',
  name: 'Ali',
} as const;

/** Wires the auth use cases against in-memory adapters (no database, no argon2). */
export function createAuthFixture(): AuthFixture {
  const users = new InMemoryUserRepository();
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();
  const sessionIssuer = new SessionIssuer(refreshTokens, tokenService);

  return {
    users,
    refreshTokens,
    passwordHasher,
    tokenService,
    registerUser: new RegisterUser(users, passwordHasher),
    loginUser: new LoginUser(users, passwordHasher, sessionIssuer),
    refreshSession: new RefreshSession(users, refreshTokens, sessionIssuer, tokenService),
    logoutUser: new LogoutUser(refreshTokens, tokenService),
    getCurrentUser: new GetCurrentUser(users),
  };
}
