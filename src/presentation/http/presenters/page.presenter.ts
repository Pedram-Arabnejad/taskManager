import type { Page } from '../../../domain/repositories/pagination';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;
}

/** Spec 0.3: every list answers `{ data, meta: { page, limit, total, totalPages } }`. */
export function toPaginatedResponse<T, R>(page: Page<T>, map: (item: T) => R): PaginatedResponse<R> {
  return {
    data: page.items.map(map),
    meta: {
      page: page.page,
      limit: page.limit,
      total: page.total,
      totalPages: page.limit === 0 ? 0 : Math.ceil(page.total / page.limit),
    },
  };
}
