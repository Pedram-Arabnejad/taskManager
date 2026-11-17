import type { Role } from '../entities/user';

export interface AccessTokenClaims {
  userId: string;
  role: Role;
}

export interface IssuedAccessToken {
  token: string;
  expiresIn: number;
}

/** Everything needed to persist a refresh token - the raw token is never stored. */
export interface RefreshTokenMaterial {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

/** Port implemented by infrastructure/security/jwt-token-service.ts */
export interface TokenService {
  issueAccessToken(claims: AccessTokenClaims): IssuedAccessToken;
  verifyAccessToken(token: string): AccessTokenClaims;
  createRefreshToken(userId: string, now?: Date): RefreshTokenMaterial;
  hashRefreshToken(token: string): string;
  refreshTokenExpiry(now?: Date): Date;
}
