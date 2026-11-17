import { Role } from '../../../src/domain/entities/user';
import { EmailAlreadyExistsError, InvalidEmailError } from '../../../src/domain/errors/domain-errors';
import { createAuthFixture, VALID_REGISTRATION } from '../../helpers/auth-fixture';

describe('RegisterUser', () => {
  it('should store the user with a hashed password and the USER role when the email is new', async () => {
    const fixture = createAuthFixture();

    const user = await fixture.registerUser.execute(VALID_REGISTRATION);

    expect(user.role).toBe(Role.USER);
    expect(user.passwordHash).toBe(`hashed:${VALID_REGISTRATION.password}`);
    expect(user.name).toBe('Ali');
    expect(await fixture.users.findById(user.id)).not.toBeNull();
  });

  it('should reject the registration when the email already exists in another case', async () => {
    const fixture = createAuthFixture();
    await fixture.registerUser.execute(VALID_REGISTRATION);

    await expect(
      fixture.registerUser.execute({ ...VALID_REGISTRATION, email: 'ALI@Example.com' }),
    ).rejects.toThrow(EmailAlreadyExistsError);
  });

  it('should reject an invalid email before touching the repository', async () => {
    const fixture = createAuthFixture();

    await expect(
      fixture.registerUser.execute({ ...VALID_REGISTRATION, email: 'not-an-email' }),
    ).rejects.toThrow(InvalidEmailError);
    expect(fixture.users.items.size).toBe(0);
  });

  it('should store a hash instead of the plain password', async () => {
    const fixture = createAuthFixture();

    const user = await fixture.registerUser.execute(VALID_REGISTRATION);

    // the fake hasher prefixes its input, which is enough to prove the plain
    // value was never what got persisted
    expect(user.passwordHash).not.toBe(VALID_REGISTRATION.password);
    expect(fixture.passwordHasher.hashCalls).toContain(VALID_REGISTRATION.password);
  });
});
