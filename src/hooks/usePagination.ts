"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationMeta } from "@/lib/pagination";

type UsePaginationOptions = {
  /** Pagination from API response (e.g. fullRes.pagination) */
  pagination: PaginationMeta;
  /** When true, display page from local state (avoids stale page while loading) */
  loading?: boolean;
  /** When this value changes, page is reset to 1 (e.g. status filter) */
  resetPageWhen?: unknown;
  /** Initial page (default 1) */
  initialPage?: number;
};

export type PaginationBarProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPrev: () => void;
  onNext: () => void;
  showBar: boolean;
};

/**
 * Reusable pagination state and API-derived values.
 * - Manages `page` state; resets to 1 when `resetPageWhen` changes.
 * - Does not perform fetch: parent calls API with `page` and passes back `pagination` from response.
 * - Use a ref for the fetch function in the parent’s effect so the effect only depends on [page, ...filters] and avoids infinite loops.
 *
 * @example
 * const getReviewsRef = useRef(getReviews);
 * getReviewsRef.current = getReviews;
 *
 * const { page, setPage, paginationBarProps } = usePagination({
 *   pagination: reviewsFullData?.pagination ?? null,
 *   loading: reviewsLoading,
 *   resetPageWhen: statusFilter,
 *   onPageOrFilterChange: (p) => {
 *     getReviewsRef.current(fetchApi({ page: p, status: statusFilter }));
 *   },
 * });
 *
 * useEffect(() => {
 *   onPageOrFilterChange?.(page);
 * }, [page, resetPageWhen, onPageOrFilterChange]);
 * // But onPageOrFilterChange should be ref-based or stable to avoid loop – see ChallengedReviewsSection.
 */
export function usePagination(options: UsePaginationOptions) {
  const {
    pagination,
    loading = false,
    resetPageWhen,
    initialPage = 1,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const prevResetRef = useRef(resetPageWhen);

  // Reset page when filter (resetPageWhen) changes
  useEffect(() => {
    if (prevResetRef.current !== resetPageWhen) {
      prevResetRef.current = resetPageWhen;
      setPageState(1);
    }
  }, [resetPageWhen]);

  const setPage = useCallback((value: number | ((prev: number) => number)) => {
    setPageState(value);
  }, []);

  const resetPage = useCallback(() => {
    setPageState(1);
  }, []);

  const hasNext = pagination?.has_next ?? false;
  const hasPrev = pagination?.has_prev ?? false;
  const totalItems = pagination?.total_items ?? 0;
  const totalPages = pagination?.total_pages ?? 1;
  const serverPage = pagination?.page ?? 1;
  const currentPage = loading ? page : serverPage;

  const paginationBarProps: PaginationBarProps = {
    currentPage,
    totalPages,
    totalItems,
    hasNext,
    hasPrev,
    onPrev: () => setPageState((p) => Math.max(1, p - 1)),
    onNext: () => setPageState((p) => p + 1),
    showBar: true,
  };

  return {
    page,
    setPage,
    resetPage,
    hasNext,
    hasPrev,
    totalItems,
    totalPages,
    currentPage,
    paginationBarProps,
  };
}
