import type { RefreshToken } from '../../src/domain/entities/refresh-token';
import type { RefreshTokenRepository } from '../../src/domain/repositories/refresh-token.repository';

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  readonly items = new Map<string, RefreshToken>();
  readonly revokeAllCalls: string[] = [];

  async create(token: RefreshToken): Promise<RefreshToken> {
    this.items.set(token.id, token);

    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    for (const token of this.items.values()) {
      if (token.tokenHash === tokenHash) {
        return token;
      }
    }

    return null;
  }

  async revoke(token: RefreshToken): Promise<void> {
    this.items.set(token.id, token);
  }

  async revokeAllForUser(userId: string, now: Date = new Date()): Promise<void> {
    this.revokeAllCalls.push(userId);

    for (const token of this.items.values()) {
      if (token.userId === userId) {
        token.revoke(null, now);
      }
    }
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    let deleted = 0;

    for (const [id, token] of [...this.items.entries()]) {
      if (token.isExpired(now)) {
        this.items.delete(id);
        deleted += 1;
      }
    }

    return deleted;
  }
}
