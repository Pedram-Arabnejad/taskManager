import request from 'supertest';

import { createApp } from '../../src/app';
import { createContainer } from '../../src/container';

describe('Health endpoints', () => {
  const app = createApp(createContainer());

  it('should return status ok when GET /health is called', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should echo the incoming request id when the x-request-id header is provided', async () => {
    const response = await request(app).get('/health').set('x-request-id', 'trace-abc-123');

    expect(response.headers['x-request-id']).toBe('trace-abc-123');
  });

  it('should generate a request id when the header is missing', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should return the standard error envelope when the route does not exist', async () => {
    const response = await request(app).get('/does-not-exist').expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
    expect(response.body.error.message).toContain('/does-not-exist');
  });

  it('should return VALIDATION_ERROR when the JSON body is malformed', async () => {
    const response = await request(app)
      .post('/health')
      .set('content-type', 'application/json')
      .send('{ "broken": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
