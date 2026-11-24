import type { User } from '../../../domain/entities/user';
import type { Page, PageRequest } from '../../../domain/repositories/pagination';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface ListUsersInput {
  search?: string;
  page: PageRequest;
}

export class ListUsers {
  constructor(private readonly users: UserRepository) {}

  async execute(input: ListUsersInput): Promise<Page<User>> {
    return this.users.findMany({ search: input.search, page: input.page });
  }
}
