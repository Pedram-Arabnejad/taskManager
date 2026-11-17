import type { PrismaClient } from '@prisma/client';

import type { HealthProbe } from '../../domain/services/health-probe';

export class PrismaHealthProbe implements HealthProbe {
  constructor(private readonly prisma: PrismaClient) {}

  async isReady(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
