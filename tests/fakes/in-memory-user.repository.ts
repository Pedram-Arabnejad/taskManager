import type { User } from '../../src/domain/entities/user';
import { toPage, type Page } from '../../src/domain/repositories/pagination';
import type { UserListQuery, UserRepository } from '../../src/domain/repositories/user.repository';
import type { Email } from '../../src/domain/value-objects/email';

export class InMemoryUserRepository implements UserRepository {
  readonly items = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.items.get(id) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.items.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }

    return null;
  }

  async create(user: User): Promise<User> {
    this.items.set(user.id, user);

    return user;
  }

  async update(user: User): Promise<User> {
    this.items.set(user.id, user);

    return user;
  }

  async findMany(query: UserListQuery): Promise<Page<User>> {
    const search = query.search?.trim().toLowerCase();
    const all = [...this.items.values()].filter((user) => {
      if (search === undefined || search.length === 0) {
        return true;
      }

      return user.email.value.includes(search) || user.name.toLowerCase().includes(search);
    });

    const start = (query.page.page - 1) * query.page.limit;

    return toPage(all.slice(start, start + query.page.limit), all.length, query.page);
  }
}
