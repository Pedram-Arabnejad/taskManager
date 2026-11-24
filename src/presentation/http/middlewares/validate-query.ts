import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/**
 * Express 5 exposes `req.query` as a getter, so the parsed value is stored on
 * `req.validatedQuery` instead of being written back.
 */
export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const query: unknown = req.query;
    const result = schema.safeParse(query);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.validatedQuery = result.data;
    next();
  };
}
