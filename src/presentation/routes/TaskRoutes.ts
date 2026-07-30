import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { roleMiddleware } from '../middlewares/RoleMiddleware';
import { JwtProvider } from '../../infrastructure/auth/JwtProvider';

export const createTaskRoutes = (
  taskController: TaskController,
  jwtProvider: JwtProvider,
): Router => {
  const router = Router();

  router.get('/', authMiddleware(jwtProvider), (req, res) =>
    taskController.getUserTasks(req, res),
  );

  router.get('/:id', authMiddleware(jwtProvider), (req, res) =>
    taskController.getTaskById(req, res),
  );

  router.post('/', authMiddleware(jwtProvider), (req, res) =>
    taskController.createTask(req, res),
  );

  router.put('/:id', authMiddleware(jwtProvider), (req, res) =>
    taskController.updateTask(req, res),
  );

  router.delete('/:id', authMiddleware(jwtProvider), (req, res) =>
    taskController.deleteTask(req, res),
  );

  return router;
};
