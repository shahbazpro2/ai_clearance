"use client";

import { Button } from "@/components/ui/button";
import type { PaginationBarProps as UsePaginationBarProps } from "@/hooks/usePagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type PaginationBarProps = UsePaginationBarProps & {
  /** Optional class for the container */
  className?: string;
};

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  hasNext,
  hasPrev,
  onPrev,
  onNext,
  showBar,
  className,
}: PaginationBarProps) {
  if (!showBar) return null;

  return (
    <div
      className={
        className ??
        "px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-white"
      }
    >
      <p className="text-sm text-gray-600">
        Page {currentPage} of {totalPages} ({totalItems} records total)
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev}
          type="button"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          type="button"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
