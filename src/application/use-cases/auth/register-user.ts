import { User } from '../../../domain/entities/user';
import { EmailAlreadyExistsError } from '../../../domain/errors/domain-errors';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../../domain/services/password-hasher';
import { Email } from '../../../domain/value-objects/email';

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = Email.create(input.email);

    const existing = await this.users.findByEmail(email);

    if (existing !== null) {
      throw new EmailAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({ email, passwordHash, name: input.name });

    return this.users.create(user);
  }
}
