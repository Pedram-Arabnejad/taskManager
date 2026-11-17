import type { User } from '../../../domain/entities/user';
import { UnauthenticatedError } from '../../../domain/errors/domain-errors';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface GetCurrentUserInput {
  userId: string;
}

export class GetCurrentUser {
  constructor(private readonly users: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<User> {
    const user = await this.users.findById(input.userId);

    if (user === null) {
      throw new UnauthenticatedError('The authenticated user no longer exists');
    }

    return user;
  }
}
