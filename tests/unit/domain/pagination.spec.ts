import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  normalizePageRequest,
  toPage,
} from '../../../src/domain/repositories/pagination';

describe('pagination', () => {
  it('should fall back to page 1 and limit 20 when nothing is requested', () => {
    expect(normalizePageRequest()).toEqual({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT });
  });

  it('should clamp the limit to 100 when a larger limit is requested', () => {
    expect(normalizePageRequest({ page: 2, limit: 5000 })).toEqual({ page: 2, limit: MAX_LIMIT });
  });

  it('should clamp the page to 1 when a smaller page is requested', () => {
    expect(normalizePageRequest({ page: 0, limit: 10 }).page).toBe(1);
    expect(normalizePageRequest({ page: -3, limit: 10 }).page).toBe(1);
  });

  it('should clamp the limit to at least 1 when zero is requested', () => {
    expect(normalizePageRequest({ limit: 0 }).limit).toBe(1);
  });

  it('should carry the request page and limit into the page result when paging', () => {
    expect(toPage(['a', 'b'], 42, { page: 3, limit: 10 })).toEqual({
      items: ['a', 'b'],
      total: 42,
      page: 3,
      limit: 10,
    });
  });
});
