import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

const MAX_REQUEST_ID_LENGTH = 128;

function normalizeIncoming(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REQUEST_ID_LENGTH) {
    return undefined;
  }

  return trimmed;
}

/**
 * Accepts a caller supplied `x-request-id` (so a trace can be followed across services)
 * and otherwise generates one. The value is echoed back on the response and included in
 * every error body.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = normalizeIncoming(req.header(REQUEST_ID_HEADER)) ?? randomUUID();

  req.requestId = id;
  res.setHeader(REQUEST_ID_HEADER, id);

  next();
}
