import type { Request } from 'express';

import { UnauthenticatedError } from '../../domain/errors/domain-errors';
import type { AccessTokenClaims } from '../../domain/services/token-service';

/** Controllers sit behind `authenticate`; this keeps the type narrowing in one place. */
export function requireAuth(req: Request): AccessTokenClaims {
  if (req.auth === undefined) {
    throw new UnauthenticatedError();
  }

  return req.auth;
}
