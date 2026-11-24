import type { RefreshToken } from '../entities/refresh-token';

export interface RefreshTokenRepository {
  create(token: RefreshToken): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  /** Persists revokedAt / replacedById of an already loaded token. */
  revoke(token: RefreshToken): Promise<void>;
  /** Reuse detection revokes every session of a user (spec 1.7, step 3). */
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(now?: Date): Promise<number>;
}
