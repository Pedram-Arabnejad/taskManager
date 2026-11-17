import { Router } from 'express';

/**
 * Liveness probe. Deliberately does not touch the database: it answers
 * "is this process able to serve traffic at all?".
 */
export function createHealthRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return router;
}
