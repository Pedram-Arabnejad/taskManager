import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { DomainError, type ErrorDetail } from '../../../domain/errors/domain-errors';
import { logger } from '../../../infrastructure/logging/logger';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    requestId: string;
  };
}

function send(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: ErrorDetail[],
): void {
  const body: ErrorEnvelope = {
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
      requestId: res.req.requestId,
    },
  };

  res.status(status).json(body);
}

function zodDetails(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join('.') || 'body',
    message: issue.message,
  }));
}

function isBodyParseError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === 'entity.parse.failed'
  );
}

/**
 * Single exit point for every failure. Guarantees the documented error shape
 * (part 0.4 of the spec) and never leaks stack traces or internal messages on 5xx.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof DomainError) {
    send(res, error.httpStatus, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    send(res, 400, 'VALIDATION_ERROR', 'Request validation failed', zodDetails(error));
    return;
  }

  if (isBodyParseError(error)) {
    send(res, 400, 'VALIDATION_ERROR', 'Request body is not valid JSON');
    return;
  }

  logger.error({ err: error, requestId: req.requestId }, 'unhandled error');
  send(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
