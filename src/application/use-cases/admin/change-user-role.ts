import type { Role, User } from '../../../domain/entities/user';
import { CannotChangeOwnRoleError, NotFoundError } from '../../../domain/errors/domain-errors';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface ChangeUserRoleInput {
  actorId: string;
  targetUserId: string;
  role: Role;
}

export class ChangeUserRole {
  constructor(private readonly users: UserRepository) {}

  async execute(input: ChangeUserRoleInput): Promise<User> {
    // Spec 1.1, rule 8: an admin cannot demote (or promote) themselves.
    if (input.actorId === input.targetUserId) {
      throw new CannotChangeOwnRoleError();
    }

    const user = await this.users.findById(input.targetUserId);

    if (user === null) {
      throw new NotFoundError('User not found');
    }

    user.changeRole(input.role);

    return this.users.update(user);
  }
}
