"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
    getCategoryBrandsApi,
    saveBrandApprovalSettingsApi,
} from "@/api/retailer";
import { ChevronLeft, Lock, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Brand {
    id: string;
    name: string;
    domain: string | null;
    category_id: string;
    brand_salesforce_id: string;
    updated_at: string;
    is_blocked: boolean;
}

interface BrandPagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

const PAGE_SIZE = 25;

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryBrandsPageProps {
    audienceId?: string;
    channelId: string;
    categoryId: string;
    categoryName?: string;
    /** Render without setup-flow chrome (progress header and role restriction) */
    embedded?: boolean;
    /** Back destination override (renders a back bar in embedded mode) */
    backHref?: string;
}

export function CategoryBrandsPage({
    audienceId,
    channelId,
    categoryId,
    categoryName,
    embedded = false,
    backHref,
}: CategoryBrandsPageProps) {
    const router = useRouter();
    const userData = useMe();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [pagination, setPagination] = useState<BrandPagination | null>(null);
    const [canUpdateBrands, setCanUpdateBrands] = useState(false);
    const [page, setPage] = useState(1);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [callFetch, { loading, error }] = useApi({ errMsg: true });
    const [callUpdate] = useApi({ errMsg: true });

    const fetchBrands = useCallback(
        (pageNum: number) => {
            callFetch(
                getCategoryBrandsApi({
                    category_id: categoryId,
                    channel_id: channelId,
                    page: pageNum,
                    limit: PAGE_SIZE,
                }),
                ({ data }: any) => {
                    setBrands(data?.brands ?? []);
                    setCanUpdateBrands(data?.can_update_individual_brands ?? false);
                    setPagination(data?.pagination ?? null);
                }
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [categoryId, channelId]
    );

    useEffect(() => {
        setPage(1);
        fetchBrands(1);
    }, [fetchBrands]);

    // Refetch when the page changes
    useEffect(() => {
        if (page === 1) return;
        fetchBrands(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // Restrict access for retailer role (dashboard tab is available to both roles)
    if (!embedded && userData && userData.role === "retailer") {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto mt-12">
                        <Card>
                            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                                    <Lock className="h-8 w-8 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Access Restricted
                                </h2>
                                <p className="text-sm text-gray-600 max-w-xs">
                                    This page is only available for setup administrators. Please contact your account manager.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

    const handleToggle = (brand: Brand, isBlocked: boolean) => {
        if (!canUpdateBrands || updatingId) return;
        setUpdatingId(brand.brand_salesforce_id);
        callUpdate(
            saveBrandApprovalSettingsApi({
                channel_id: channelId,
                brand_salesforce_id: brand.brand_salesforce_id,
                is_blocked: isBlocked,
            }),
            () => {
                setUpdatingId(null);
                fetchBrands(page);
            },
            () => {
                setUpdatingId(null);
            }
        );
    };

    const totalPages = pagination?.total_pages ?? 1;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return (
        <div className={embedded ? "" : "min-h-screen bg-gray-50"}>
            {!embedded && <SetupProgressHeader stepOverride={2} />}

            {/* Back navigation bar */}
            {!embedded ? (
                <div className="bg-white border-b sticky top-14 z-20">
                    <div className="container mx-auto px-4 py-3">
                        <button
                            onClick={() =>
                                router.push(
                                    `/retailer/audiences/setup/step/${audienceId}/2/brand-approval/${channelId}`
                                )
                            }
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Brand Approval Settings
                        </button>
                    </div>
                </div>
            ) : backHref ? (
                <div className="bg-white border-b sticky top-14 z-20">
                    <div className="container mx-auto px-4 py-3">
                        <button
                            onClick={() => router.push(backHref)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Brand Approval Settings
                        </button>
                    </div>
                </div>
            ) : null}

            <main className={embedded ? "" : "container mx-auto px-4 py-8"}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {categoryName ? `Brands — ${categoryName}` : "Category Brands"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                            {canUpdateBrands
                                ? "Approve or block individual brands in this category."
                                : "Brand approval is managed at the category level. Individual brand updates are not available for this category."}
                        </p>
                    </div>
                    <Button
                        onClick={() => fetchBrands(page)}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                        <div className="py-16 flex items-center justify-center gap-2 text-sm text-gray-500">
                            <LoadingSpinner size="lg" />
                            Loading category brands...
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <p className="text-sm text-red-600">Failed to load brands.</p>
                        <Button variant="outline" size="sm" onClick={() => fetchBrands(page)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && (
                    <>
                        {brands.length === 0 ? (
                            <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                                No brands found in this category.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Domain / Website URL</th>
                                                <th className="px-4 py-3">Current Status</th>
                                                <th className="px-4 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {brands.map((brand) => {
                                                const isUpdating = updatingId === brand.brand_salesforce_id;

                                                return (
                                                    <tr
                                                        key={brand.brand_salesforce_id ?? brand.id}
                                                        className="border-t hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {brand.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {brand.domain ? (
                                                                <a
                                                                    href={
                                                                        brand.domain.startsWith("http")
                                                                            ? brand.domain
                                                                            : `https://${brand.domain}`
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:underline"
                                                                >
                                                                    {brand.domain}
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className={
                                                                    brand.is_blocked
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-green-100 text-green-700"
                                                                }
                                                            >
                                                                {brand.is_blocked ? "Blocked" : "Approved"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {canUpdateBrands ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Switch
                                                                        checked={brand.is_blocked}
                                                                        disabled={isUpdating || !!updatingId}
                                                                        onCheckedChange={(checked) =>
                                                                            handleToggle(brand, checked)
                                                                        }
                                                                        aria-label={`Toggle approval for ${brand.name}`}
                                                                    />
                                                                    {isUpdating && <LoadingSpinner size="sm" />}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                                    <Lock className="h-3.5 w-3.5" />
                                                                    Read only
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {pagination && pagination.total_pages > 1 && (
                                    <PaginationBar
                                        currentPage={page}
                                        totalPages={pagination.total_pages}
                                        totalItems={pagination.total}
                                        hasNext={hasNext}
                                        hasPrev={hasPrev}
                                        onPrev={() => setPage((p) => Math.max(1, p - 1))}
                                        onNext={() => setPage((p) => p + 1)}
                                        showBar={true}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
