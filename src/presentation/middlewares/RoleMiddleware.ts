import { Response, NextFunction } from 'express';
import { AuthRequest } from './AuthMiddleware';

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      _res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      _res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
      return;
    }

    next();
  };
};
