import { RefreshToken } from '../../../src/domain/entities/refresh-token';
import {
  InvalidRefreshTokenError,
  RefreshTokenReusedError,
} from '../../../src/domain/errors/domain-errors';
import { createAuthFixture, VALID_REGISTRATION } from '../../helpers/auth-fixture';

describe('RefreshSession', () => {
  async function loggedInFixture(): Promise<{
    fixture: ReturnType<typeof createAuthFixture>;
    userId: string;
    refreshToken: string;
  }> {
    const fixture = createAuthFixture();
    await fixture.registerUser.execute(VALID_REGISTRATION);
    const login = await fixture.loginUser.execute({
      email: VALID_REGISTRATION.email,
      password: VALID_REGISTRATION.password,
    });

    return { fixture, userId: login.user.id, refreshToken: login.tokens.refreshToken };
  }

  it('should return a new pair and revoke the presented token when it is active', async () => {
    const { fixture, refreshToken } = await loggedInFixture();

    const rotated = await fixture.refreshSession.execute({ refreshToken });

    expect(rotated.refreshToken).not.toBe(refreshToken);
    expect(rotated.accessToken).toMatch(/^access-token-/);
  });

  it('should record replacedById so the rotation chain is traceable', async () => {
    const { fixture, refreshToken } = await loggedInFixture();

    const rotated = await fixture.refreshSession.execute({ refreshToken });

    const previous = await fixture.refreshTokens.findByTokenHash(
      fixture.tokenService.hashRefreshToken(refreshToken),
    );
    const next = await fixture.refreshTokens.findByTokenHash(
      fixture.tokenService.hashRefreshToken(rotated.refreshToken),
    );

    expect(previous?.isRevoked()).toBe(true);
    expect(previous?.replacedById).toBe(next?.id);
  });

  it('should reject an unknown token', async () => {
    const { fixture } = await loggedInFixture();

    await expect(
      fixture.refreshSession.execute({ refreshToken: 'not-a-real-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('should reject an expired token without treating it as reuse', async () => {
    const { fixture, userId } = await loggedInFixture();
    const expiredToken = 'expired-refresh-token';

    await fixture.refreshTokens.create(
      RefreshToken.issue({
        userId,
        tokenHash: fixture.tokenService.hashRefreshToken(expiredToken),
        expiresAt: new Date(Date.now() - 60_000),
      }),
    );

    await expect(fixture.refreshSession.execute({ refreshToken: expiredToken })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
    expect(fixture.refreshTokens.revokeAllCalls).toHaveLength(0);
  });

  it('should revoke every session when a rotated token is presented again', async () => {
    const { fixture, userId, refreshToken } = await loggedInFixture();
    const rotated = await fixture.refreshSession.execute({ refreshToken });

    await expect(fixture.refreshSession.execute({ refreshToken })).rejects.toThrow(
      RefreshTokenReusedError,
    );

    expect(fixture.refreshTokens.revokeAllCalls).toContain(userId);

    const replacement = await fixture.refreshTokens.findByTokenHash(
      fixture.tokenService.hashRefreshToken(rotated.refreshToken),
    );
    expect(replacement?.isRevoked()).toBe(true);
  });

  it('should reject the replacement token after reuse detection revoked everything', async () => {
    const { fixture, refreshToken } = await loggedInFixture();
    const rotated = await fixture.refreshSession.execute({ refreshToken });

    await fixture.refreshSession.execute({ refreshToken }).catch(() => undefined);

    await expect(
      fixture.refreshSession.execute({ refreshToken: rotated.refreshToken }),
    ).rejects.toThrow(RefreshTokenReusedError);
  });
});
