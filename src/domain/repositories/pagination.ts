/** Spec 0.3: default page 1 / limit 20, maximum limit 100. */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PageRequest {
  page: number;
  limit: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function normalizePageRequest(request?: {
  page?: number;
  limit?: number;
}): PageRequest {
  const page = Math.max(DEFAULT_PAGE, Math.trunc(request?.page ?? DEFAULT_PAGE));
  const rawLimit = Math.trunc(request?.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT));

  return { page, limit };
}

export function toPage<T>(items: T[], total: number, request: PageRequest): Page<T> {
  return { items, total, page: request.page, limit: request.limit };
}
