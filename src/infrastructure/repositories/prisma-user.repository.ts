import type { Prisma, PrismaClient } from '@prisma/client';

import type { User } from '../../domain/entities/user';
import { toPage, type Page } from '../../domain/repositories/pagination';
import type { UserListQuery, UserRepository } from '../../domain/repositories/user.repository';
import type { Email } from '../../domain/value-objects/email';
import { toDomainUser, toUserCreateInput, toUserUpdateInput } from './mappers/user.mapper';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });

    return row === null ? null : toDomainUser(row);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.value } });

    return row === null ? null : toDomainUser(row);
  }

  async create(user: User): Promise<User> {
    const row = await this.prisma.user.create({ data: toUserCreateInput(user) });

    return toDomainUser(row);
  }

  async update(user: User): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: toUserUpdateInput(user),
    });

    return toDomainUser(row);
  }

  async findMany(query: UserListQuery): Promise<Page<User>> {
    const where: Prisma.UserWhereInput =
      query.search === undefined || query.search.trim().length === 0
        ? {}
        : {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page.page - 1) * query.page.limit,
        take: query.page.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPage(rows.map(toDomainUser), total, query.page);
  }
}
