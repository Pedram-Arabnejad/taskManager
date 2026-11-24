import { type RequestHandler, Router } from 'express';

import type { TaskController } from '../controllers/task.controller';
import { validateBody } from '../middlewares/validate';
import { changeTaskStatusBodySchema, updateTaskBodySchema } from '../schemas/task.schemas';

export interface TaskRouterDependencies {
  controller: TaskController;
  authenticate: RequestHandler;
}

/** `/api/v1/tasks` - tasks are addressed by id and scoped through their project. */
export function createTaskRouter(dependencies: TaskRouterDependencies): Router {
  const router = Router();
  const { controller, authenticate } = dependencies;

  router.use(authenticate);

  router.get('/:taskId', (req, res) => controller.getById(req, res));
  router.patch('/:taskId/status', validateBody(changeTaskStatusBodySchema), (req, res) =>
    controller.changeStatus(req, res),
  );
  router.patch('/:taskId', validateBody(updateTaskBodySchema), (req, res) =>
    controller.update(req, res),
  );
  router.delete('/:taskId', (req, res) => controller.remove(req, res));

  return router;
}
