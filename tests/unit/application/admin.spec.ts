import { randomUUID } from 'node:crypto';

import { Role, User } from '../../../src/domain/entities/user';
import {
  CannotChangeOwnRoleError,
  NotFoundError,
} from '../../../src/domain/errors/domain-errors';
import { Email } from '../../../src/domain/value-objects/email';
import { ChangeUserRole } from '../../../src/application/use-cases/admin/change-user-role';
import { ListUsers } from '../../../src/application/use-cases/admin/list-users';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository';

const PAGE = { page: 1, limit: 20 };

function buildUser(email: string, role: Role = Role.USER): User {
  return User.create({
    email: Email.create(email),
    passwordHash: 'hashed:secret',
    name: email.split('@')[0] ?? 'user',
    role,
  });
}

describe('admin use cases', () => {
  it('should list users of every role when ListUsers runs', async () => {
    const users = new InMemoryUserRepository();
    await users.create(buildUser('admin@example.com', Role.ADMIN));
    await users.create(buildUser('user@example.com'));

    const page = await new ListUsers(users).execute({ page: PAGE });

    expect(page.total).toBe(2);
  });

  it('should filter by email or name when a search term is given', async () => {
    const users = new InMemoryUserRepository();
    await users.create(buildUser('ali@example.com'));
    await users.create(buildUser('sara@example.com'));

    const page = await new ListUsers(users).execute({ search: 'sara', page: PAGE });

    expect(page.total).toBe(1);
    expect(page.items[0]?.email.value).toBe('sara@example.com');
  });

  it('should promote another user when an admin changes their role', async () => {
    const users = new InMemoryUserRepository();
    const actor = buildUser('admin@example.com', Role.ADMIN);
    const target = buildUser('user@example.com');
    await users.create(actor);
    await users.create(target);

    const updated = await new ChangeUserRole(users).execute({
      actorId: actor.id,
      targetUserId: target.id,
      role: Role.ADMIN,
    });

    expect(updated.role).toBe(Role.ADMIN);
    expect((await users.findById(target.id))?.role).toBe(Role.ADMIN);
  });

  it('should refuse to change the role of the actor themselves', async () => {
    const users = new InMemoryUserRepository();
    const actor = buildUser('admin@example.com', Role.ADMIN);
    await users.create(actor);

    await expect(
      new ChangeUserRole(users).execute({
        actorId: actor.id,
        targetUserId: actor.id,
        role: Role.USER,
      }),
    ).rejects.toThrow(CannotChangeOwnRoleError);
  });

  it('should answer NOT_FOUND when the target user does not exist', async () => {
    const users = new InMemoryUserRepository();
    const actor = buildUser('admin@example.com', Role.ADMIN);
    await users.create(actor);

    await expect(
      new ChangeUserRole(users).execute({
        actorId: actor.id,
        targetUserId: randomUUID(),
        role: Role.ADMIN,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
