import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/AuthMiddleware';
import { JwtProvider } from '../../infrastructure/auth/JwtProvider';

export const createAuthRoutes = (
  authController: AuthController,
  jwtProvider: JwtProvider,
): Router => {
  const router = Router();

  router.post('/register', (req, res) => authController.register(req, res));
  router.post('/login', (req, res) => authController.login(req, res));
  router.post('/refresh', (req, res) => authController.refresh(req, res));
  router.post('/logout', (req, res) => authController.logout(req, res));
  router.post('/logout-all', authMiddleware(jwtProvider), (req, res) =>
    authController.logoutAll(req, res),
  );

  return router;
};
