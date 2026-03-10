/**
 * Standard API pagination response shape.
 * Use this type when your API returns pagination in the response body.
 */
export type PaginationMeta = {
  has_next: boolean;
  has_prev: boolean;
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
} | null;

export const DEFAULT_PER_PAGE = 25;

/**
 * Build PaginationMeta when the API returns total/total_count instead of a full pagination object.
 * Use for responses like { data: [], total: N } or { results: [], total_count: N }.
 */
export function buildPaginationMeta(
  currentPage: number,
  perPage: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  return {
    page: currentPage,
    per_page: perPage,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: currentPage < totalPages,
    has_prev: currentPage > 1,
  };
}
