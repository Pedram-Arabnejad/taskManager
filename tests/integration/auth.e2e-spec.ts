import request from 'supertest';

import { createApp } from '../../src/app';
import { buildAuthSlice, createContainer, type AppContainer } from '../../src/container';
import { FakePasswordHasher } from '../fakes/fake-password-hasher';
import { FakeTokenService } from '../fakes/fake-token-service';
import { InMemoryRefreshTokenRepository } from '../fakes/in-memory-refresh-token.repository';
import { InMemoryUserRepository } from '../fakes/in-memory-user.repository';
import { VALID_REGISTRATION } from '../helpers/auth-fixture';

/**
 * Exercises the real HTTP stack (routing, validation, error envelope, guards)
 * against in-memory adapters, so it runs without a database.
 */
function buildTestApp(): {
  app: ReturnType<typeof createApp>;
  users: InMemoryUserRepository;
  refreshTokens: InMemoryRefreshTokenRepository;
  container: AppContainer;
} {
  const base = createContainer();
  const users = new InMemoryUserRepository();
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();

  const container: AppContainer = {
    ...base,
    users,
    refreshTokens,
    passwordHasher,
    tokenService,
    ...buildAuthSlice({ users, refreshTokens, passwordHasher, tokenService }),
  };

  return { app: createApp(container), users, refreshTokens, container };
}

const AUTH = '/api/v1/auth';

describe('Auth endpoints', () => {
  it('should create the account and hide the password hash when POST /auth/register is called', async () => {
    const { app } = buildTestApp();

    const response = await request(app).post(`${AUTH}/register`).send(VALID_REGISTRATION);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(VALID_REGISTRATION.email);
    expect(response.body.user.role).toBe('USER');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('hashed:');
  });

  it('should return 409 EMAIL_ALREADY_EXISTS when the email is already registered', async () => {
    const { app } = buildTestApp();
    await request(app).post(`${AUTH}/register`).send(VALID_REGISTRATION);

    const response = await request(app)
      .post(`${AUTH}/register`)
      .send({ ...VALID_REGISTRATION, email: 'ALI@example.com' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(response.body.error.requestId).toEqual(expect.any(String));
  });

  it('should return 400 VALIDATION_ERROR with field details when the password has no digit', async () => {
    const { app } = buildTestApp();

    const response = await request(app)
      .post(`${AUTH}/register`)
      .send({ ...VALID_REGISTRATION, password: 'onlyletters' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'password' })]),
    );
  });

  it('should return 400 VALIDATION_ERROR when an unknown field is sent', async () => {
    const { app } = buildTestApp();

    const response = await request(app)
      .post(`${AUTH}/register`)
      .send({ ...VALID_REGISTRATION, role: 'ADMIN' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return the token pair when POST /auth/login succeeds', async () => {
    const { app } = buildTestApp();
    await request(app).post(`${AUTH}/register`).send(VALID_REGISTRATION);

    const response = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: VALID_REGISTRATION.email, password: VALID_REGISTRATION.password });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toMatch(/^access-token-/);
    expect(response.body.refreshToken).toMatch(/^refresh-token-/);
    expect(response.body.expiresIn).toBe(900);
    expect(response.body.user.email).toBe(VALID_REGISTRATION.email);
  });

  it('should return 401 INVALID_CREDENTIALS when the password is wrong', async () => {
    const { app } = buildTestApp();
    await request(app).post(`${AUTH}/register`).send(VALID_REGISTRATION);

    const response = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: VALID_REGISTRATION.email, password: 'WrongPassw0rd' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 UNAUTHENTICATED when GET /auth/me has no bearer token', async () => {
    const { app } = buildTestApp();

    const response = await request(app).get(`${AUTH}/me`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('should return the current user when GET /auth/me carries a valid token', async () => {
    const { app } = buildTestApp();
    await request(app).post(`${AUTH}/register`).send(VALID_REGISTRATION);
    const login = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: VALID_REGISTRATION.email, password: VALID_REGISTRATION.password });

    const response = await request(app)
      .get(`${AUTH}/me`)
      .set('authorization', `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(VALID_REGISTRATION.email);
  });

  it('should return a new pair and detect reuse when the old token is presented again', async () => {
    const { app } = buildTestApp();
    await request(app).post(`${AUTH}/register`).send(VALID_REGISTRATION);
    const login = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: VALID_REGISTRATION.email, password: VALID_REGISTRATION.password });
    const firstRefreshToken = login.body.refreshToken as string;

    const rotated = await request(app)
      .post(`${AUTH}/refresh`)
      .send({ refreshToken: firstRefreshToken });
    expect(rotated.status).toBe(200);
    expect(rotated.body.refreshToken).not.toBe(firstRefreshToken);

    const reuse = await request(app)
      .post(`${AUTH}/refresh`)
      .send({ refreshToken: firstRefreshToken });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('REFRESH_TOKEN_REUSED');

    const afterReuse = await request(app)
      .post(`${AUTH}/refresh`)
      .send({ refreshToken: rotated.body.refreshToken as string });
    expect(afterReuse.status).toBe(401);
    expect(afterReuse.body.error.code).toBe('REFRESH_TOKEN_REUSED');
  });

  it('should return 204 and revoke the session when POST /auth/logout is called', async () => {
    const { app } = buildTestApp();
    await request(app).post(`${AUTH}/register`).send(VALID_REGISTRATION);
    const login = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: VALID_REGISTRATION.email, password: VALID_REGISTRATION.password });

    const logout = await request(app)
      .post(`${AUTH}/logout`)
      .send({ refreshToken: login.body.refreshToken as string });
    expect(logout.status).toBe(204);

    // A revoked token that is presented again is indistinguishable from a
    // replayed one, so the spec's reuse rule (1.7, step 3) applies here too.
    const refresh = await request(app)
      .post(`${AUTH}/refresh`)
      .send({ refreshToken: login.body.refreshToken as string });
    expect(refresh.status).toBe(401);
    expect(refresh.body.error.code).toBe('REFRESH_TOKEN_REUSED');
  });
});
