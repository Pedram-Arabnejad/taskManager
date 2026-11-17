import { randomUUID } from 'node:crypto';

import { Role, User } from '../../../src/domain/entities/user';
import { ValidationError } from '../../../src/domain/errors/domain-errors';
import { Email } from '../../../src/domain/value-objects/email';

const EMAIL = Email.create('ali@example.com');
const HASH = '$argon2id$v=19$m=65536,t=3,p=4$hash';

describe('User', () => {
  it('should default to the USER role and normalise the name when created', () => {
    const user = User.create({ email: EMAIL, passwordHash: HASH, name: '  Ali  ' });

    expect(user.role).toBe(Role.USER);
    expect(user.name).toBe('Ali');
    expect(user.email.value).toBe('ali@example.com');
    expect(user.isAdmin()).toBe(false);
  });

  it('should never expose a plain password, only the hash, when created', () => {
    const user = User.create({ email: EMAIL, passwordHash: HASH, name: 'Ali' });

    expect(user.passwordHash).toBe(HASH);
  });

  it('should reject an empty password hash when created', () => {
    expect(() => User.create({ email: EMAIL, passwordHash: '  ', name: 'Ali' })).toThrow(
      ValidationError,
    );
  });

  it('should reject a blank name when created', () => {
    expect(() => User.create({ email: EMAIL, passwordHash: HASH, name: '   ' })).toThrow(
      ValidationError,
    );
  });

  it('should report admin privileges when the role is ADMIN', () => {
    const user = User.create({ email: EMAIL, passwordHash: HASH, name: 'Ali', role: Role.ADMIN });

    expect(user.isAdmin()).toBe(true);
  });

  describe('changeRole', () => {
    it('should promote the user and bump updatedAt when the role changes', () => {
      const user = User.create({ email: EMAIL, passwordHash: HASH, name: 'Ali' });
      const now = new Date('2026-06-06T00:00:00.000Z');

      user.changeRole(Role.ADMIN, now);

      expect(user.role).toBe(Role.ADMIN);
      expect(user.updatedAt).toEqual(now);
    });

    it('should be a no-op when the role does not change', () => {
      const user = User.create({ email: EMAIL, passwordHash: HASH, name: 'Ali' });
      const before = user.updatedAt;

      user.changeRole(Role.USER, new Date('2027-01-01T00:00:00.000Z'));

      expect(user.updatedAt).toEqual(before);
    });
  });

  describe('reconstitute', () => {
    it('should preserve the persisted role and timestamps when rebuilt from the database', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const user = User.reconstitute({
        id: randomUUID(),
        email: EMAIL,
        passwordHash: HASH,
        name: 'Ali',
        role: Role.ADMIN,
        createdAt,
        updatedAt: createdAt,
      });

      expect(user.role).toBe(Role.ADMIN);
      expect(user.createdAt).toEqual(createdAt);
    });
  });
});
