import { randomUUID } from 'node:crypto';

import type { AuthTokens } from '../../dto/auth';
import type { User } from '../../../domain/entities/user';
import { InvalidCredentialsError } from '../../../domain/errors/domain-errors';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../../domain/services/password-hasher';
import { Email } from '../../../domain/value-objects/email';
import type { SessionIssuer } from './session-issuer';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  user: User;
  tokens: AuthTokens;
}

export class LoginUser {
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.users.findByEmail(Email.create(input.email));

    // Verify against a dummy hash when the account does not exist so that the
    // response time does not reveal whether an email is registered.
    const passwordHash = user?.passwordHash ?? (await this.getDummyHash());
    const passwordMatches = await this.passwordHasher.verify(passwordHash, input.password);

    if (user === null || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const session = await this.sessionIssuer.issue(user.id, user.role);

    return { user, tokens: session.tokens };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash(randomUUID());

    return this.dummyHash;
  }
}
