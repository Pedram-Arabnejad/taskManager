import type { $Enums, Prisma, User as PrismaUser } from '@prisma/client';

import { Role, User } from '../../../domain/entities/user';
import { Email } from '../../../domain/value-objects/email';

const ROLE_FROM_PRISMA: Record<$Enums.Role, Role> = {
  USER: Role.USER,
  ADMIN: Role.ADMIN,
};

const ROLE_TO_PRISMA: Record<Role, $Enums.Role> = {
  [Role.USER]: 'USER',
  [Role.ADMIN]: 'ADMIN',
};

export function toDomainUser(row: PrismaUser): User {
  return User.reconstitute({
    id: row.id,
    email: Email.create(row.email),
    passwordHash: row.passwordHash,
    name: row.name,
    role: ROLE_FROM_PRISMA[row.role],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toUserCreateInput(user: User): Prisma.UserUncheckedCreateInput {
  return {
    id: user.id,
    email: user.email.value,
    passwordHash: user.passwordHash,
    name: user.name,
    role: ROLE_TO_PRISMA[user.role],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toUserUpdateInput(user: User): Prisma.UserUncheckedUpdateInput {
  return {
    email: user.email.value,
    passwordHash: user.passwordHash,
    name: user.name,
    role: ROLE_TO_PRISMA[user.role],
    updatedAt: user.updatedAt,
  };
}
