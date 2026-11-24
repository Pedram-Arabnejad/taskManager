import request from 'supertest';

import { createTestApp, type TestApp } from '../helpers/test-app';

const API = '/api/v1';

function authHeader(token: string): string {
  return `Bearer ${token}`;
}

async function createProject(
  testApp: TestApp,
  token: string,
  name = 'Portfolio',
): Promise<string> {
  const response = await request(testApp.app)
    .post(`${API}/projects`)
    .set('authorization', authHeader(token))
    .send({ name });

  return response.body.id as string;
}

describe('projects and tasks endpoints', () => {
  it('should return 401 UNAUTHENTICATED when GET /projects has no token', async () => {
    const testApp = createTestApp();

    const response = await request(testApp.app).get(`${API}/projects`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('should create a project when POST /projects is called by its owner', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();

    const response = await request(testApp.app)
      .post(`${API}/projects`)
      .set('authorization', authHeader(token))
      .send({ name: 'Portfolio', description: 'backend projects' });

    expect(response.status).toBe(201);
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.name).toBe('Portfolio');
    expect(response.body.description).toBe('backend projects');
  });

  it('should return the documented pagination envelope when GET /projects is called', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    await createProject(testApp, token, 'One');
    await createProject(testApp, token, 'Two');
    await createProject(testApp, token, 'Three');

    const response = await request(testApp.app)
      .get(`${API}/projects?page=2&limit=2`)
      .set('authorization', authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('should return 404 NOT_FOUND when the project belongs to another user', async () => {
    const testApp = createTestApp();
    const owner = testApp.issueToken();
    const stranger = testApp.issueToken();
    const projectId = await createProject(testApp, owner.token);

    const response = await request(testApp.app)
      .get(`${API}/projects/${projectId}`)
      .set('authorization', authHeader(stranger.token));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 VALIDATION_ERROR when PATCH /projects/:id carries no field', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);

    const response = await request(testApp.app)
      .patch(`${API}/projects/${projectId}`)
      .set('authorization', authHeader(token))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should delete the project and return 204 when DELETE /projects/:id is called', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);

    const deleted = await request(testApp.app)
      .delete(`${API}/projects/${projectId}`)
      .set('authorization', authHeader(token));
    expect(deleted.status).toBe(204);

    const afterDelete = await request(testApp.app)
      .get(`${API}/projects/${projectId}`)
      .set('authorization', authHeader(token));
    expect(afterDelete.status).toBe(404);
  });

  it('should create a TODO task inside the project when POST /projects/:id/tasks is called', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);

    const response = await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(token))
      .send({ title: 'Write the README', priority: 'HIGH' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('TODO');
    expect(response.body.priority).toBe('HIGH');
    expect(response.body.projectId).toBe(projectId);
  });

  it('should filter tasks by status and keep the pagination meta when listing', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);
    await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(token))
      .send({ title: 'First' });
    await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(token))
      .send({ title: 'Second' });

    const response = await request(testApp.app)
      .get(`${API}/projects/${projectId}/tasks?status=TODO&sort=priority&order=asc&limit=1`)
      .set('authorization', authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
  });

  it('should reject an unknown query parameter when listing tasks', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);

    const response = await request(testApp.app)
      .get(`${API}/projects/${projectId}/tasks?sortBy=whatever`)
      .set('authorization', authHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should refuse a status change inside PATCH /tasks/:id when status is in the body', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);
    const created = await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(token))
      .send({ title: 'Task' });

    const response = await request(testApp.app)
      .patch(`${API}/tasks/${created.body.id as string}`)
      .set('authorization', authHeader(token))
      .send({ status: 'DONE' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 422 TASK_INVALID_TRANSITION when TODO jumps straight to DONE', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);
    const created = await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(token))
      .send({ title: 'Task' });

    const response = await request(testApp.app)
      .patch(`${API}/tasks/${created.body.id as string}/status`)
      .set('authorization', authHeader(token))
      .send({ status: 'DONE' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('TASK_INVALID_TRANSITION');
  });

  it('should move a task through the workflow and stamp completedAt when it reaches DONE', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);
    const created = await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(token))
      .send({ title: 'Task' });
    const taskId = created.body.id as string;

    await request(testApp.app)
      .patch(`${API}/tasks/${taskId}/status`)
      .set('authorization', authHeader(token))
      .send({ status: 'IN_PROGRESS' });
    const done = await request(testApp.app)
      .patch(`${API}/tasks/${taskId}/status`)
      .set('authorization', authHeader(token))
      .send({ status: 'DONE' });

    expect(done.status).toBe(200);
    expect(done.body.status).toBe('DONE');
    expect(done.body.completedAt).toEqual(expect.any(String));
  });

  it('should return 404 when a task from another user is read by id', async () => {
    const testApp = createTestApp();
    const owner = testApp.issueToken();
    const stranger = testApp.issueToken();
    const projectId = await createProject(testApp, owner.token);
    const created = await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(owner.token))
      .send({ title: 'Task' });

    const response = await request(testApp.app)
      .get(`${API}/tasks/${created.body.id as string}`)
      .set('authorization', authHeader(stranger.token));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should delete the task and return 204 when DELETE /tasks/:id is called', async () => {
    const testApp = createTestApp();
    const { token } = testApp.issueToken();
    const projectId = await createProject(testApp, token);
    const created = await request(testApp.app)
      .post(`${API}/projects/${projectId}/tasks`)
      .set('authorization', authHeader(token))
      .send({ title: 'Task' });

    const deleted = await request(testApp.app)
      .delete(`${API}/tasks/${created.body.id as string}`)
      .set('authorization', authHeader(token));
    expect(deleted.status).toBe(204);

    const afterDelete = await request(testApp.app)
      .get(`${API}/tasks/${created.body.id as string}`)
      .set('authorization', authHeader(token));
    expect(afterDelete.status).toBe(404);
  });
});
