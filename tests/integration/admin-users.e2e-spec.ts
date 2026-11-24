import request from 'supertest';

import { Role, User } from '../../src/domain/entities/user';
import { Email } from '../../src/domain/value-objects/email';
import { createTestApp } from '../helpers/test-app';

const API = '/api/v1';

async function seedUser(
  users: ReturnType<typeof createTestApp>['users'],
  email: string,
  role: Role,
): Promise<User> {
  return users.create(
    User.create({ email: Email.create(email), passwordHash: 'hashed:secret', name: 'Someone', role }),
  );
}

describe('admin endpoints', () => {
  it('should return 403 FORBIDDEN when a USER calls GET /admin/users', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken(Role.USER);

    const response = await request(testApp.app)
      .get(`${API}/admin/users`)
      .set('authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 401 UNAUTHENTICATED when no token is presented', async () => {
    const testApp = createTestApp();

    const response = await request(testApp.app).get(`${API}/admin/users`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('should list users with pagination meta when an ADMIN calls GET /admin/users', async () => {
    const testApp = createTestApp();
    const admin = testApp.issueToken(Role.ADMIN);
    await seedUser(testApp.users, 'first@example.com', Role.USER);
    await seedUser(testApp.users, 'second@example.com', Role.ADMIN);

    const response = await request(testApp.app)
      .get(`${API}/admin/users?limit=1`)
      .set('authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(response.body.data[0]).not.toHaveProperty('passwordHash');
  });

  it('should promote another user when an ADMIN patches their role', async () => {
    const testApp = createTestApp();
    const admin = testApp.issueToken(Role.ADMIN);
    const target = await seedUser(testApp.users, 'target@example.com', Role.USER);

    const response = await request(testApp.app)
      .patch(`${API}/admin/users/${target.id}/role`)
      .set('authorization', `Bearer ${admin.token}`)
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('ADMIN');
  });

  it('should answer 422 CANNOT_CHANGE_OWN_ROLE when an ADMIN changes their own role', async () => {
    const testApp = createTestApp();
    const admin = testApp.issueToken(Role.ADMIN);
    await seedUser(testApp.users, 'admin@example.com', Role.ADMIN);

    const response = await request(testApp.app)
      .patch(`${API}/admin/users/${admin.userId}/role`)
      .set('authorization', `Bearer ${admin.token}`)
      .send({ role: 'USER' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('CANNOT_CHANGE_OWN_ROLE');
  });

  it('should return 404 NOT_FOUND when the target user does not exist', async () => {
    const testApp = createTestApp();
    const admin = testApp.issueToken(Role.ADMIN);

    const response = await request(testApp.app)
      .patch(`${API}/admin/users/3f1d6a4e-0000-4000-8000-000000000000/role`)
      .set('authorization', `Bearer ${admin.token}`)
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should reject an invalid role value when patching a role', async () => {
    const testApp = createTestApp();
    const admin = testApp.issueToken(Role.ADMIN);
    const target = await seedUser(testApp.users, 'target@example.com', Role.USER);

    const response = await request(testApp.app)
      .patch(`${API}/admin/users/${target.id}/role`)
      .set('authorization', `Bearer ${admin.token}`)
      .send({ role: 'SUPERUSER' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
