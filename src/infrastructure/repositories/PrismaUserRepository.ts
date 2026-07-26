import { User } from '../../../domain/entities/User';
import { Role } from '../../../domain/enums/Role';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import prisma from '../database/prisma/PrismaClient';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async create(user: User): Promise<User> {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role as any,
      },
    });
    return this.toDomain(created);
  }

  async update(user: User): Promise<User> {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        name: user.name,
        role: user.role as any,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async findAll(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ]);
    return {
      users: users.map((u) => this.toDomain(u)),
      total,
    };
  }

  private toDomain(data: any): User {
    return new User(
      data.id,
      data.email,
      data.password,
      data.name,
      data.role as Role,
      data.createdAt,
      data.updatedAt,
    );
  }
}
