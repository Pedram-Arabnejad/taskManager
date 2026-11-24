import type { PrismaClient } from '@prisma/client';

import type { RefreshToken } from '../../domain/entities/refresh-token';
import type { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import {
  toDomainRefreshToken,
  toRefreshTokenCreateInput,
} from './mappers/refresh-token.mapper';

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(token: RefreshToken): Promise<RefreshToken> {
    const row = await this.prisma.refreshToken.create({ data: toRefreshTokenCreateInput(token) });

    return toDomainRefreshToken(row);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    return row === null ? null : toDomainRefreshToken(row);
  }

  async revoke(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: token.revokedAt, replacedById: token.replacedById },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(now: Date = new Date()): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    return result.count;
  }
}
