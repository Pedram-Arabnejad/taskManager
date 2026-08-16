import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/AppError';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';

  // Operational errors are expected; unexpected ones get the full stack trace
  if (err instanceof AppError) {
    console.error(`[ERROR] ${statusCode} - ${message}`);
  } else {
    console.error('[ERROR] Unhandled error:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};
