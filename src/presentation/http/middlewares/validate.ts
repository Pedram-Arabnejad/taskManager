import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/**
 * Replaces `req.body` with the parsed value and forwards the ZodError to the
 * error handler, which renders it as `400 VALIDATION_ERROR` with field details.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const body: unknown = req.body;
    const result = schema.safeParse(body);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
}
