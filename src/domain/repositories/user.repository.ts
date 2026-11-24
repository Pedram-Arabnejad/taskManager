import type { User } from '../entities/user';
import type { Email } from '../value-objects/email';
import type { Page, PageRequest } from './pagination';

export interface UserListQuery {
  search?: string;
  page: PageRequest;
}

/** Port implemented by infrastructure/repositories/prisma-user.repository.ts */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  findMany(query: UserListQuery): Promise<Page<User>>;
}
