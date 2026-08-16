import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { roleMiddleware } from '../middlewares/RoleMiddleware';
import { JwtProvider } from '../../infrastructure/auth/JwtProvider';
import { Role } from '../../domain/enums/Role';

export const createAdminRoutes = (
  adminController: AdminController,
  jwtProvider: JwtProvider,
): Router => {
  const router = Router();

  router.get(
    '/stats',
    authMiddleware(jwtProvider),
    roleMiddleware(Role.ADMIN),
    (req, res) => adminController.getStats(req, res),
  );

  return router;
};
