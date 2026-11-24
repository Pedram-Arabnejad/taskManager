import argon2 from 'argon2';

import type { PasswordHasher } from '../../domain/services/password-hasher';

/**
 * Argon2id with the OWASP baseline parameters (19 MiB, t=2, p=1).
 * `verify` never throws: a malformed hash is simply a failed comparison.
 */
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, HASH_OPTIONS);
  }

  async verify(passwordHash: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, plainPassword);
    } catch {
      return false;
    }
  }
}
