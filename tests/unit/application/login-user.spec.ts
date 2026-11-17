import { InvalidCredentialsError } from '../../../src/domain/errors/domain-errors';
import { createAuthFixture, VALID_REGISTRATION } from '../../helpers/auth-fixture';

describe('LoginUser', () => {
  async function registeredFixture(): Promise<ReturnType<typeof createAuthFixture>> {
    const fixture = createAuthFixture();
    await fixture.registerUser.execute(VALID_REGISTRATION);

    return fixture;
  }

  it('should return an access token, a refresh token and the user when the credentials are valid', async () => {
    const fixture = await registeredFixture();

    const result = await fixture.loginUser.execute({
      email: VALID_REGISTRATION.email,
      password: VALID_REGISTRATION.password,
    });

    expect(result.tokens.accessToken).toMatch(/^access-token-/);
    expect(result.tokens.refreshToken).toMatch(/^refresh-token-/);
    expect(result.tokens.expiresIn).toBe(900);
    expect(result.user.email.value).toBe(VALID_REGISTRATION.email);
  });

  it('should persist only the hash of the issued refresh token', async () => {
    const fixture = await registeredFixture();

    const result = await fixture.loginUser.execute({
      email: VALID_REGISTRATION.email,
      password: VALID_REGISTRATION.password,
    });

    const stored = [...fixture.refreshTokens.items.values()];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.tokenHash).toBe(fixture.tokenService.hashRefreshToken(result.tokens.refreshToken));
    expect(stored[0]?.tokenHash).not.toBe(result.tokens.refreshToken);
  });

  it('should reject the login when the password is wrong', async () => {
    const fixture = await registeredFixture();

    await expect(
      fixture.loginUser.execute({ email: VALID_REGISTRATION.email, password: 'WrongPassw0rd' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should reject the login when the email is unknown', async () => {
    const fixture = await registeredFixture();

    await expect(
      fixture.loginUser.execute({ email: 'nobody@example.com', password: VALID_REGISTRATION.password }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should return the same error code for an unknown email and a wrong password', async () => {
    const fixture = await registeredFixture();

    const unknownEmail = await fixture.loginUser
      .execute({ email: 'nobody@example.com', password: VALID_REGISTRATION.password })
      .catch((error: unknown) => error);
    const wrongPassword = await fixture.loginUser
      .execute({ email: VALID_REGISTRATION.email, password: 'WrongPassw0rd' })
      .catch((error: unknown) => error);

    expect((unknownEmail as InvalidCredentialsError).code).toBe(
      (wrongPassword as InvalidCredentialsError).code,
    );
    expect((unknownEmail as InvalidCredentialsError).message).toBe(
      (wrongPassword as InvalidCredentialsError).message,
    );
  });

  it('should still hash a dummy password when the email is unknown so timing stays comparable', async () => {
    const fixture = await registeredFixture();
    const callsBefore = fixture.passwordHasher.hashCalls.length;

    await fixture.loginUser
      .execute({ email: 'nobody@example.com', password: VALID_REGISTRATION.password })
      .catch(() => undefined);

    expect(fixture.passwordHasher.hashCalls.length).toBe(callsBefore + 1);
  });
});
