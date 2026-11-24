import type { AuthTokens } from '../../dto/auth';
import { RefreshToken } from '../../../domain/entities/refresh-token';
import type { Role } from '../../../domain/entities/user';
import type { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import type { TokenService } from '../../../domain/services/token-service';

export interface IssuedSession {
  tokens: AuthTokens;
  /** Id of the persisted refresh token, needed to chain rotation (`replacedById`). */
  refreshTokenId: string;
}

/**
 * Issues an access/refresh pair and persists the refresh token as a hash.
 * Shared by login and refresh so rotation has exactly one implementation.
 */
export class SessionIssuer {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async issue(userId: string, role: Role): Promise<IssuedSession> {
    const accessToken = this.tokenService.issueAccessToken({ userId, role });
    const material = this.tokenService.createRefreshToken(userId);

    const stored = await this.refreshTokens.create(
      RefreshToken.issue({
        userId,
        tokenHash: material.tokenHash,
        expiresAt: material.expiresAt,
      }),
    );

    return {
      tokens: {
        accessToken: accessToken.token,
        refreshToken: material.token,
        expiresIn: accessToken.expiresIn,
      },
      refreshTokenId: stored.id,
    };
  }
}
