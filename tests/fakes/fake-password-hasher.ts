import type { PasswordHasher } from '../../src/domain/services/password-hasher';

/** Deterministic stand-in for argon2 - unit tests must not pay the hashing cost. */
export class FakePasswordHasher implements PasswordHasher {
  readonly hashCalls: string[] = [];

  async hash(plainPassword: string): Promise<string> {
    this.hashCalls.push(plainPassword);

    return `hashed:${plainPassword}`;
  }

  async verify(passwordHash: string, plainPassword: string): Promise<boolean> {
    return passwordHash === `hashed:${plainPassword}`;
  }
}
