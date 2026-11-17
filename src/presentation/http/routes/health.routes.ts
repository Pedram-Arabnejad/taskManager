import { Router } from 'express';

import type { HealthProbe } from '../../../domain/services/health-probe';

/**
 * `GET /health` is the liveness probe and deliberately avoids the database:
 * it answers "can this process serve traffic at all?".
 * `GET /health/ready` is the readiness probe and reports 503 while a dependency
 * (today: Postgres) is unreachable, so a load balancer can take the instance out.
 */
export function createHealthRouter(probe: HealthProbe): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  router.get('/ready', async (_req, res) => {
    const ready = await probe.isReady();

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ok' : 'unavailable',
      checks: { database: ready ? 'up' : 'down' },
    });
  });

  return router;
}
