import { UnauthenticatedError } from '../../src/domain/errors/domain-errors';
import type {
  AccessTokenClaims,
  IssuedAccessToken,
  RefreshTokenMaterial,
  TokenService,
} from '../../src/domain/services/token-service';

const ACCESS_TTL_SECONDS = 900;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Deterministic tokens so assertions can compare exact strings. */
export class FakeTokenService implements TokenService {
  private readonly accessTokens = new Map<string, AccessTokenClaims>();
  private sequence = 0;

  issueAccessToken(claims: AccessTokenClaims): IssuedAccessToken {
    this.sequence += 1;
    const token = `access-token-${this.sequence}`;
    this.accessTokens.set(token, claims);

    return { token, expiresIn: ACCESS_TTL_SECONDS };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    const claims = this.accessTokens.get(token);

    if (claims === undefined) {
      throw new UnauthenticatedError('Access token is invalid or expired');
    }

    return claims;
  }

  createRefreshToken(_userId: string, now: Date = new Date()): RefreshTokenMaterial {
    this.sequence += 1;
    const token = `refresh-token-${this.sequence}`;

    return {
      token,
      tokenHash: this.hashRefreshToken(token),
      expiresAt: this.refreshTokenExpiry(now),
    };
  }

  hashRefreshToken(token: string): string {
    return `sha256:${token}`;
  }

  refreshTokenExpiry(now: Date = new Date()): Date {
    return new Date(now.getTime() + REFRESH_TTL_MS);
  }
}
