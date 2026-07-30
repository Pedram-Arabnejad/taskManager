import { Request, Response, NextFunction } from 'express';
import { JwtProvider } from '../../infrastructure/auth/JwtProvider';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (jwtProvider: JwtProvider) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      _res.status(401).json({
        status: 'error',
        message: 'Access token is required',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = jwtProvider.verifyAccessToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch {
      _res.status(401).json({
        status: 'error',
        message: 'Invalid or expired access token',
      });
    }
  };
};
