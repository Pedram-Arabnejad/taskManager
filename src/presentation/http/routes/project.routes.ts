import { type RequestHandler, Router } from 'express';

import type { ProjectController } from '../controllers/project.controller';
import type { TaskController } from '../controllers/task.controller';
import { validateQuery } from '../middlewares/validate-query';
import { validateBody } from '../middlewares/validate';
import { listProjectsQuerySchema, listTasksQuerySchema } from '../schemas/pagination.schemas';
import { createProjectBodySchema, updateProjectBodySchema } from '../schemas/project.schemas';
import { createTaskBodySchema } from '../schemas/task.schemas';

export interface ProjectRouterDependencies {
  projectController: ProjectController;
  taskController: TaskController;
  authenticate: RequestHandler;
}

/** `/api/v1/projects` plus the nested `/projects/:projectId/tasks` collection. */
export function createProjectRouter(dependencies: ProjectRouterDependencies): Router {
  const router = Router();
  const { projectController, taskController, authenticate } = dependencies;

  router.use(authenticate);

  router.post('/', validateBody(createProjectBodySchema), (req, res) =>
    projectController.create(req, res),
  );
  router.get('/', validateQuery(listProjectsQuerySchema), (req, res) =>
    projectController.list(req, res),
  );

  router.post('/:projectId/tasks', validateBody(createTaskBodySchema), (req, res) =>
    taskController.create(req, res),
  );
  router.get('/:projectId/tasks', validateQuery(listTasksQuerySchema), (req, res) =>
    taskController.list(req, res),
  );

  router.get('/:projectId', (req, res) => projectController.getById(req, res));
  router.patch('/:projectId', validateBody(updateProjectBodySchema), (req, res) =>
    projectController.update(req, res),
  );
  router.delete('/:projectId', (req, res) => projectController.remove(req, res));

  return router;
}
