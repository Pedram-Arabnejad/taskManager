import type { RequestHandler } from 'express';

import type { Role } from '../../../domain/entities/user';
import { ForbiddenError, UnauthenticatedError } from '../../../domain/errors/domain-errors';

/** Role guard. Ownership checks belong to the application layer, not here (spec 2.1 note). */
export function authorize(...allowedRoles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (req.auth === undefined) {
      next(new UnauthenticatedError());
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
