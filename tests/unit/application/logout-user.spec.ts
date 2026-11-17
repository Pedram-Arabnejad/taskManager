import { createAuthFixture, VALID_REGISTRATION } from '../../helpers/auth-fixture';

describe('LogoutUser', () => {
  async function loggedInFixture(): Promise<{
    fixture: ReturnType<typeof createAuthFixture>;
    refreshToken: string;
  }> {
    const fixture = createAuthFixture();
    await fixture.registerUser.execute(VALID_REGISTRATION);
    const login = await fixture.loginUser.execute({
      email: VALID_REGISTRATION.email,
      password: VALID_REGISTRATION.password,
    });

    return { fixture, refreshToken: login.tokens.refreshToken };
  }

  it('should revoke the presented refresh token', async () => {
    const { fixture, refreshToken } = await loggedInFixture();

    await fixture.logoutUser.execute({ refreshToken });

    const stored = await fixture.refreshTokens.findByTokenHash(
      fixture.tokenService.hashRefreshToken(refreshToken),
    );
    expect(stored?.isRevoked()).toBe(true);
  });

  it('should be a no-op when the token is unknown', async () => {
    const { fixture } = await loggedInFixture();

    await expect(
      fixture.logoutUser.execute({ refreshToken: 'unknown-token' }),
    ).resolves.toBeUndefined();
  });

  it('should stay a no-op when the token was already revoked', async () => {
    const { fixture, refreshToken } = await loggedInFixture();
    await fixture.logoutUser.execute({ refreshToken });

    await expect(fixture.logoutUser.execute({ refreshToken })).resolves.toBeUndefined();

    const stored = await fixture.refreshTokens.findByTokenHash(
      fixture.tokenService.hashRefreshToken(refreshToken),
    );
    expect(stored?.isRevoked()).toBe(true);
  });
});
