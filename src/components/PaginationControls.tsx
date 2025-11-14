"use client";

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface PaginationData {
    page: number;
    total: number;
    pages: number;
    limit: number;
}

interface PaginationControlsProps {
    pagination: PaginationData;
    isLoading?: boolean;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
}

export default function PaginationControls({
    pagination,
    isLoading = false,
    onPageChange,
    onLimitChange
}: PaginationControlsProps) {
    console.log('pgggg', pagination)
    const generatePageNumbers = () => {
        const pages = [];
        const current = pagination.page;
        const total = pagination.pages;

        // Always show first page
        if (current > 3) {
            pages.push(1);
            if (current > 4) {
                pages.push('ellipsis');
            }
        }

        // Show pages around current page
        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
            pages.push(i);
        }

        // Always show last page
        if (current < total - 2) {
            if (current < total - 3) {
                pages.push('ellipsis');
            }
            pages.push(total);
        }

        return pages;
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <div className="text-sm text-muted-foreground flex items-center space-x-2">
                <span>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} stamps
                </span>
                {isLoading && <LoadingSpinner size="sm" color="primary" />}
            </div>

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            size="default"
                            onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page > 1) {
                                    onPageChange(pagination.page - 1);
                                }
                            }}
                            className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>

                    {generatePageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                            {page === 'ellipsis' ? (
                                <PaginationEllipsis />
                            ) : (
                                <PaginationLink
                                    href="#"
                                    size="icon"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onPageChange(page as number);
                                    }}
                                    isActive={page === pagination.page}
                                    className={isLoading ? "pointer-events-none opacity-50" : ""}
                                >
                                    {page}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            size="default"
                            onClick={(e) => {
                                e.preventDefault();
                                if (pagination.page < pagination.pages) {
                                    onPageChange(pagination.page + 1);
                                }
                            }}
                            className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}
