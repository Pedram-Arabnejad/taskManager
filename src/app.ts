import { randomUUID } from 'node:crypto';

import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';

import type { AppContainer } from './container';
import { errorHandler } from './presentation/http/middlewares/error-handler';
import { notFoundHandler } from './presentation/http/middlewares/not-found';
import { requestId } from './presentation/http/middlewares/request-id';
import { createAuthRouter } from './presentation/http/routes/auth.routes';
import { createHealthRouter } from './presentation/http/routes/health.routes';

const BODY_LIMIT = '100kb';
const HEALTH_PATH = '/health';
const API_PREFIX = '/api/v1';

/**
 * App factory: builds a fully wired Express app without opening a port,
 * which is what makes supertest based integration tests possible.
 *
 * Middleware order (part 1.9 of the spec):
 * request-id -> logger -> body parser -> routes -> not-found -> error-handler
 */
export function createApp(container: AppContainer): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(
    pinoHttp({
      logger: container.logger,
      genReqId: (_req, res) => {
        const header = res.getHeader('x-request-id');
        return typeof header === 'string' ? header : randomUUID();
      },
      autoLogging: { ignore: (req) => req.url === HEALTH_PATH },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) {
          return 'error';
        }
        return res.statusCode >= 400 ? 'warn' : 'info';
      },
    }),
  );
  app.use(express.json({ limit: BODY_LIMIT }));

  app.use(HEALTH_PATH, createHealthRouter(container.healthProbe));

  app.use(
    `${API_PREFIX}/auth`,
    createAuthRouter({
      controller: container.authController,
      authenticate: container.authenticate,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
