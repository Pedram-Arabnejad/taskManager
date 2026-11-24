import { randomUUID } from 'node:crypto';

import { RefreshToken } from '../../../src/domain/entities/refresh-token';

const USER_ID = randomUUID();
const TOKEN_HASH = 'a'.repeat(64);

function issuedToken(expiresAt: Date, now: Date): RefreshToken {
  return RefreshToken.issue({ userId: USER_ID, tokenHash: TOKEN_HASH, expiresAt }, now);
}

describe('RefreshToken', () => {
  it('should start active with no revocation when issued', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const token = issuedToken(new Date('2026-01-08T00:00:00.000Z'), now);

    expect(token.isRevoked()).toBe(false);
    expect(token.revokedAt).toBeNull();
    expect(token.replacedById).toBeNull();
    expect(token.isActive(now)).toBe(true);
  });

  it('should be inactive once the expiry has passed', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const token = issuedToken(new Date('2026-01-02T00:00:00.000Z'), now);

    expect(token.isExpired(new Date('2026-01-03T00:00:00.000Z'))).toBe(true);
    expect(token.isActive(new Date('2026-01-03T00:00:00.000Z'))).toBe(false);
  });

  it('should record revokedAt and the replacement when rotated', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const token = issuedToken(new Date('2026-01-08T00:00:00.000Z'), now);
    const replacementId = randomUUID();
    const revokedAt = new Date('2026-01-02T00:00:00.000Z');

    token.revoke(replacementId, revokedAt);

    expect(token.revokedAt).toEqual(revokedAt);
    expect(token.replacedById).toBe(replacementId);
    expect(token.isActive(new Date('2026-01-03T00:00:00.000Z'))).toBe(false);
  });

  it('should stay revoked with the original replacement when revoked twice', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const token = issuedToken(new Date('2026-01-08T00:00:00.000Z'), now);
    const firstReplacement = randomUUID();
    const firstRevokedAt = new Date('2026-01-02T00:00:00.000Z');

    token.revoke(firstReplacement, firstRevokedAt);
    token.revoke(randomUUID(), new Date('2026-01-03T00:00:00.000Z'));

    expect(token.replacedById).toBe(firstReplacement);
    expect(token.revokedAt).toEqual(firstRevokedAt);
  });
});
