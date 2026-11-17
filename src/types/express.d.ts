import type { AccessTokenClaims } from '../domain/services/token-service';

declare global {
  namespace Express {
    interface Request {
      /** Correlation id set by the request-id middleware. */
      requestId: string;
      /** Set by the authenticate middleware; undefined on public routes. */
      auth?: AccessTokenClaims;
    }
  }
}

export {};
