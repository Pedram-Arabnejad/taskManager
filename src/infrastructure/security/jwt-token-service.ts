import { createHash, randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import { Role } from '../../domain/entities/user';
import { UnauthenticatedError } from '../../domain/errors/domain-errors';
import type {
  AccessTokenClaims,
  IssuedAccessToken,
  RefreshTokenMaterial,
  TokenService,
} from '../../domain/services/token-service';

const ISSUER = 'taskflow';
const ALGORITHM = 'HS256';
const REFRESH_TOKEN_BYTES = 48;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toRole(value: unknown): Role | null {
  if (value === Role.ADMIN) {
    return Role.ADMIN;
  }

  if (value === Role.USER) {
    return Role.USER;
  }

  return null;
}

/**
 * Access token: JWT (HS256, 15 min) carrying `sub`, `role`, `iat`, `exp`, `iss`.
 * Refresh token: opaque 48-byte random string. Only its SHA-256 hash is persisted,
 * so the token itself exists nowhere but in the client's hands (spec 1.7).
 */
export class JwtTokenService implements TokenService {
  issueAccessToken(claims: AccessTokenClaims): IssuedAccessToken {
    const token = jwt.sign({ role: claims.role }, env.JWT_ACCESS_SECRET, {
      algorithm: ALGORITHM,
      issuer: ISSUER,
      subject: claims.userId,
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    });

    return { token, expiresIn: env.JWT_ACCESS_TTL_SECONDS };
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    let decoded: string | jwt.JwtPayload;

    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
      });
    } catch {
      throw new UnauthenticatedError('Access token is invalid or expired');
    }

    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      throw new UnauthenticatedError('Access token is invalid or expired');
    }

    const role = toRole(decoded.role);

    if (role === null) {
      throw new UnauthenticatedError('Access token is invalid or expired');
    }

    return { userId: decoded.sub, role };
  }

  createRefreshToken(_userId: string, now: Date = new Date()): RefreshTokenMaterial {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');

    return {
      token,
      tokenHash: this.hashRefreshToken(token),
      expiresAt: this.refreshTokenExpiry(now),
    };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  refreshTokenExpiry(now: Date = new Date()): Date {
    return new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * MS_PER_DAY);
  }
}
