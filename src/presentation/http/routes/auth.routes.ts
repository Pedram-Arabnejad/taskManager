import { type RequestHandler, Router } from 'express';

import type { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from '../schemas/auth.schemas';

export interface AuthRouterDependencies {
  controller: AuthController;
  authenticate: RequestHandler;
}

export function createAuthRouter(dependencies: AuthRouterDependencies): Router {
  const router = Router();
  const { controller, authenticate } = dependencies;

  router.post('/register', validateBody(registerBodySchema), (req, res) =>
    controller.register(req, res),
  );
  router.post('/login', validateBody(loginBodySchema), (req, res) => controller.login(req, res));
  router.post('/refresh', validateBody(refreshBodySchema), (req, res) =>
    controller.refresh(req, res),
  );
  router.post('/logout', validateBody(logoutBodySchema), (req, res) => controller.logout(req, res));
  router.get('/me', authenticate, (req, res) => controller.me(req, res));

  return router;
}
