import type { RequestHandler } from 'express';

import { UnauthenticatedError } from '../../../domain/errors/domain-errors';
import type { TokenService } from '../../../domain/services/token-service';

const BEARER_PREFIX = 'bearer ';

/** Reads `Authorization: Bearer <jwt>` and attaches `req.auth`. Any failure is 401. */
export function authenticate(tokenService: TokenService): RequestHandler {
  return (req, _res, next) => {
    const header = req.header('authorization');

    if (header === undefined || !header.toLowerCase().startsWith(BEARER_PREFIX)) {
      next(new UnauthenticatedError());
      return;
    }

    const token = header.slice(BEARER_PREFIX.length).trim();

    if (token.length === 0) {
      next(new UnauthenticatedError());
      return;
    }

    try {
      req.auth = tokenService.verifyAccessToken(token);
      next();
    } catch {
      next(new UnauthenticatedError());
    }
  };
}
