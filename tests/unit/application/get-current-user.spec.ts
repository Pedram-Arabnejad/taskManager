import { randomUUID } from 'node:crypto';

import { UnauthenticatedError } from '../../../src/domain/errors/domain-errors';
import { createAuthFixture, VALID_REGISTRATION } from '../../helpers/auth-fixture';

describe('GetCurrentUser', () => {
  it('should return the user when the id exists', async () => {
    const fixture = createAuthFixture();
    const registered = await fixture.registerUser.execute(VALID_REGISTRATION);

    const user = await fixture.getCurrentUser.execute({ userId: registered.id });

    expect(user.email.value).toBe(VALID_REGISTRATION.email);
  });

  it('should reject with UNAUTHENTICATED when the user was removed', async () => {
    const fixture = createAuthFixture();

    await expect(fixture.getCurrentUser.execute({ userId: randomUUID() })).rejects.toThrow(
      UnauthenticatedError,
    );
  });
});
