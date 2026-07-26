import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '../../../domain/interfaces/IRefreshTokenRepository';
import prisma from '../database/prisma/PrismaClient';

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  async findByToken(token: string): Promise<RefreshToken | null> {
    const record = await prisma.refreshToken.findUnique({ where: { token } });
    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const records = await prisma.refreshToken.findMany({ where: { userId } });
    return records.map((r) => this.toDomain(r));
  }

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const created = await prisma.refreshToken.create({
      data: {
        id: refreshToken.id,
        token: refreshToken.token,
        userId: refreshToken.userId,
        expiresAt: refreshToken.expiresAt,
      },
    });
    return this.toDomain(created);
  }

  async delete(id: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { id } });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  private toDomain(data: any): RefreshToken {
    return new RefreshToken(
      data.id,
      data.token,
      data.userId,
      data.expiresAt,
      data.createdAt,
    );
  }
}
