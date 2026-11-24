import { type RequestHandler, Router } from 'express';

import { Role } from '../../../domain/entities/user';
import type { AdminController } from '../controllers/admin.controller';
import { validateBody } from '../middlewares/validate';
import { validateQuery } from '../middlewares/validate-query';
import { changeUserRoleBodySchema, listUsersQuerySchema } from '../schemas/admin.schemas';

export interface AdminRouterDependencies {
  controller: AdminController;
  authenticate: RequestHandler;
  authorize: (...roles: Role[]) => RequestHandler;
}

/** Role checks live in the guard; ownership would never be checked here (spec 2.1 note). */
export function createAdminRouter(dependencies: AdminRouterDependencies): Router {
  const router = Router();
  const { controller, authenticate, authorize } = dependencies;

  router.use(authenticate, authorize(Role.ADMIN));

  router.get('/users', validateQuery(listUsersQuerySchema), (req, res) =>
    controller.listUsers(req, res),
  );
  router.patch('/users/:userId/role', validateBody(changeUserRoleBodySchema), (req, res) =>
    controller.changeRole(req, res),
  );

  return router;
}
