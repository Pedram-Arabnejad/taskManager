/** Port implemented by infrastructure/security/argon2-password-hasher.ts */
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(passwordHash: string, plainPassword: string): Promise<boolean>;
}
