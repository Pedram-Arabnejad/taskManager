import type { AuthTokens } from '../../dto/auth';
import {
  InvalidRefreshTokenError,
  RefreshTokenReusedError,
} from '../../../domain/errors/domain-errors';
import type { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { TokenService } from '../../../domain/services/token-service';
import type { SessionIssuer } from './session-issuer';

export interface RefreshSessionInput {
  refreshToken: string;
}

/**
 * Refresh with rotation and reuse detection (spec 1.7):
 *  1. hash the presented token and look it up
 *  2. unknown or expired -> 401 INVALID_REFRESH_TOKEN
 *  3. already revoked -> the token was replayed: revoke every session of that
 *     user and answer 401 REFRESH_TOKEN_REUSED
 *  4. otherwise revoke it pointing at the replacement and issue a new pair
 */
export class RefreshSession {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly sessionIssuer: SessionIssuer,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RefreshSessionInput): Promise<AuthTokens> {
    const tokenHash = this.tokenService.hashRefreshToken(input.refreshToken);
    const stored = await this.refreshTokens.findByTokenHash(tokenHash);

    if (stored === null || stored.isExpired()) {
      throw new InvalidRefreshTokenError();
    }

    if (stored.isRevoked()) {
      await this.refreshTokens.revokeAllForUser(stored.userId);
      throw new RefreshTokenReusedError();
    }

    const user = await this.users.findById(stored.userId);

    if (user === null) {
      throw new InvalidRefreshTokenError();
    }

    const session = await this.sessionIssuer.issue(user.id, user.role);

    stored.revoke(session.refreshTokenId);
    await this.refreshTokens.revoke(stored);

    return session.tokens;
  }
}
