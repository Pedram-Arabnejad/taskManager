import type { Prisma, RefreshToken as PrismaRefreshToken } from '@prisma/client';

import { RefreshToken } from '../../../domain/entities/refresh-token';

export function toDomainRefreshToken(row: PrismaRefreshToken): RefreshToken {
  return RefreshToken.reconstitute({
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    replacedById: row.replacedById,
    createdAt: row.createdAt,
  });
}

export function toRefreshTokenCreateInput(
  token: RefreshToken,
): Prisma.RefreshTokenUncheckedCreateInput {
  return {
    id: token.id,
    userId: token.userId,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt,
    revokedAt: token.revokedAt,
    replacedById: token.replacedById,
    createdAt: token.createdAt,
  };
}
