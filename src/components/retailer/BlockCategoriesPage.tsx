"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "use-hook-api";
import {
    getChannelCategoryStatusApi,
    updateChannelCategoryStatusApi,
    viewGcpInsertImagesApi,
} from "@/api/retailer";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChevronDown, ChevronUp, Search, Eye } from "lucide-react";
import { SampleViewerDialog } from "@/components/common/SampleViewerDialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategoryHistory {
    name: string;
    is_blocked: boolean;
    changed_at: string;
}

interface Category {
    id: string;
    category: string;
    history: CategoryHistory[];
}

interface InsertImage {
    image_url: string;
}

interface InsertImagePagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
    try {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
}

function getCurrentStatus(category: Category): boolean {
    if (!category.history || category.history.length === 0) return false;
    const sorted = [...category.history].sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );
    return sorted[0].is_blocked;
}

// ─── Sample Inserts Modal ─────────────────────────────────────────────────────

interface SampleInsertsModalProps {
    open: boolean;
    onClose: () => void;
    categoryId: string;
    categoryName: string;
}

function SampleInsertsModal({
    open,
    onClose,
    categoryId,
    categoryName,
}: SampleInsertsModalProps) {
    const [images, setImages] = useState<InsertImage[]>([]);
    const [pagination, setPagination] = useState<InsertImagePagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const LIMIT = 10;

    const [callFetchImages, { loading: loadingImages }] = useApi({ errMsg: true });

    const fetchImages = useCallback(
        (page: number) => {
            callFetchImages(
                viewGcpInsertImagesApi({ category_id: categoryId, page, limit: LIMIT }),
                ({ data }: any) => {
                    const newImages: InsertImage[] = data?.images ?? [];
                    const pag: InsertImagePagination = data?.pagination;
                    if (page === 1) {
                        setImages(newImages);
                    } else {
                        setImages((prev) => [...prev, ...newImages]);
                    }
                    setPagination(pag);
                    setCurrentPage(page);
                }
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [categoryId]
    );

    useEffect(() => {
        if (open && categoryId) {
            setImages([]);
            setPagination(null);
            setCurrentPage(1);
            fetchImages(1);
        }
    }, [open, categoryId, fetchImages]);

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Sample Inserts — {categoryName}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        {loadingImages && images.length === 0 ? (
                            <div className="flex items-center justify-center py-16">
                                <LoadingSpinner size="lg" />
                            </div>
                        ) : images.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 text-sm">
                                No sample inserts available for this category.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-1">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="relative group aspect-[3/4] rounded-lg overflow-hidden border bg-gray-50 cursor-pointer"
                                        onClick={() => setViewerUrl(img.image_url)}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img.image_url}
                                            alt={`Sample insert ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                                                <Eye className="h-4 w-4" />
                                                View
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pagination?.has_next && (
                            <div className="flex justify-center pt-4 pb-2">
                                <Button
                                    variant="outline"
                                    onClick={() => fetchImages(currentPage + 1)}
                                    disabled={loadingImages}
                                >
                                    {loadingImages ? (
                                        <>
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {pagination && (
                        <p className="text-xs text-gray-400 text-center pt-2 border-t">
                            Showing {images.length} of {pagination.total} images
                        </p>
                    )}
                </DialogContent>
            </Dialog>

            {/* Full-screen viewer — same as admin GCP file viewer */}
            <SampleViewerDialog
                open={!!viewerUrl}
                url={viewerUrl}
                onClose={() => setViewerUrl(null)}
                mimeType="image/jpeg"
            />
        </>
    );
}

// ─── Category Row ─────────────────────────────────────────────────────────────
interface CategoryRowProps {
    index: number;
    category: Category;
    effectiveBlocked: boolean;
    hasPendingChange: boolean;
    onToggle: (id: string, newBlocked: boolean) => void;
    onViewSamples: (id: string, name: string) => void;
}

function CategoryRow({
    index,
    category,
    effectiveBlocked,
    hasPendingChange,
    onToggle,
    onViewSamples,
}: CategoryRowProps) {
    const [expanded, setExpanded] = useState(false);

    const sortedHistory = [...(category.history ?? [])].sort(
        (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );

    const lastChange = sortedHistory[0];

    return (
        <>
            <tr className="border-t hover:bg-gray-50 transition-colors">
                {/* Expand */}
                <td className="px-4 py-3 w-10">
                    {sortedHistory.length > 0 && (
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 transition-colors"
                            aria-label="Toggle history"
                        >
                            {expanded ? (
                                <ChevronUp size={16} className="text-gray-500" />
                            ) : (
                                <ChevronDown size={16} className="text-gray-500" />
                            )}
                        </button>
                    )}
                </td>

                {/* # */}
                <td className="px-4 py-3 text-sm text-gray-400 w-12">{index + 1}</td>

                {/* Category name */}
                <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{category.category}</span>
                </td>

                {/* Last change */}
                <td className="px-4 py-3 text-sm text-gray-500">
                    {lastChange ? (
                        <span>
                            {formatDate(lastChange.changed_at)} by{" "}
                            <span className="font-medium text-gray-700">{lastChange.name}</span>
                        </span>
                    ) : (
                        <span className="text-gray-400">—</span>
                    )}
                </td>

                {/* Status toggle */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={effectiveBlocked}
                            onCheckedChange={(checked) => onToggle(category.id, checked)}
                            aria-label={`Toggle ${category.category}`}
                        />
                        <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${effectiveBlocked
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                                }`}
                        >
                            {effectiveBlocked ? "Blocked" : "Allowed"}
                        </span>
                        {hasPendingChange && (
                            <span className="text-xs text-amber-600 font-medium">unsaved</span>
                        )}
                    </div>
                </td>

                {/* View sample inserts */}
                <td className="px-4 py-3">
                    <button
                        onClick={() => onViewSamples(category.id, category.category)}
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        View sample inserts
                    </button>
                </td>
            </tr>

            {/* History rows */}
            {expanded && sortedHistory.length > 0 && (
                <tr className="border-t bg-gray-50">
                    <td colSpan={6} className="pl-16 pr-8 py-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Status History
                        </p>
                        <div className="overflow-hidden border rounded-lg bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">User</th>
                                        <th className="px-4 py-2">Status Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedHistory.map((h, i) => (
                                        <tr key={i} className="border-t last:border-t-0">
                                            <td className="px-4 py-2 text-gray-600">
                                                {formatDate(h.changed_at)}
                                            </td>
                                            <td className="px-4 py-2 font-medium text-gray-800">
                                                {h.name}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${h.is_blocked
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-green-100 text-green-700"
                                                        }`}
                                                >
                                                    {h.is_blocked ? "Blocked" : "Allowed"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BlockCategoriesPageProps {
    channelId: string;
    audienceId?: string;
    hideHeader?: boolean;
}

export function BlockCategoriesPage({ channelId, audienceId, hideHeader = false }: BlockCategoriesPageProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

    // Sample inserts modal state
    const [sampleModal, setSampleModal] = useState<{
        open: boolean;
        categoryId: string;
        categoryName: string;
    }>({ open: false, categoryId: "", categoryName: "" });

    const [callFetch, { loading: loadingCategories }] = useApi({ errMsg: true });
    const [callUpdate, { loading: saving }] = useApi({
        both: true,
        resSuccessMsg: "Category statuses updated successfully",
    });

    // Fetch categories on mount
    useEffect(() => {
        if (!channelId) return;
        callFetch(getChannelCategoryStatusApi(channelId), ({ data }: any) => {
            setCategories(data?.all_categories ?? []);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelId]);

    // Filtered list
    const filtered = categories.filter((c) =>
        c.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = (id: string, newBlocked: boolean) => {
        setPendingChanges((prev) => {
            const next = new Map(prev);
            // Find original status
            const cat = categories.find((c) => c.id === id);
            const originalBlocked = cat ? getCurrentStatus(cat) : false;
            if (newBlocked === originalBlocked) {
                // Reverted to original — remove from pending
                next.delete(id);
            } else {
                next.set(id, newBlocked);
            }
            return next;
        });
    };

    const handleSave = () => {
        if (pendingChanges.size === 0) return;
        const category_ids = Array.from(pendingChanges.entries()).map(
            ([id, is_blocked]) => ({ id, is_blocked })
        );
        callUpdate(
            updateChannelCategoryStatusApi({ channel_id: channelId, category_ids, send_email: true }),
            () => {
                setPendingChanges(new Map());
                // Redirect back to step 2 channels list after save
                if (audienceId) {
                    router.push(`/retailer/audiences/setup/step/${audienceId}/2`);
                }
            }
        );
    };

    const handleDiscard = () => {
        setPendingChanges(new Map());
    };

    const handleViewSamples = (categoryId: string, categoryName: string) => {
        setSampleModal({ open: true, categoryId, categoryName });
    };

    const hasPendingChanges = pendingChanges.size > 0;

    return (
        <div>
            {/* Header */}
            {!hideHeader && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Block Categories</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Manage allowed and blocked categories for your channel.
                        </p>
                    </div>
                </div>
            )}

            {/* Search + count */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">
                    {filtered.length} {filtered.length === 1 ? "category" : "categories"}
                </span>
            </div>

            {/* Table */}
            <div className={`overflow-hidden rounded-xl border bg-white shadow-sm ${hasPendingChanges ? "mb-20" : ""}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3 w-10"></th>
                                <th className="px-4 py-3 w-12">#</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Last Change</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Sample Inserts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingCategories && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-500 text-sm">
                                            <LoadingSpinner size="lg" />
                                            Loading categories...
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loadingCategories && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-sm text-gray-500">
                                        {search ? "No categories match your search." : "No categories found."}
                                    </td>
                                </tr>
                            )}

                            {!loadingCategories &&
                                filtered.map((cat, idx) => {
                                    const originalBlocked = getCurrentStatus(cat);
                                    const effectiveBlocked = pendingChanges.has(cat.id)
                                        ? pendingChanges.get(cat.id)!
                                        : originalBlocked;
                                    const hasPendingChange = pendingChanges.has(cat.id);

                                    return (
                                        <CategoryRow
                                            key={cat.id}
                                            index={idx}
                                            category={cat}
                                            effectiveBlocked={effectiveBlocked}
                                            hasPendingChange={hasPendingChange}
                                            onToggle={handleToggle}
                                            onViewSamples={handleViewSamples}
                                        />
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sticky bottom action bar — shown only when there are pending changes */}
            {hasPendingChanges && (
                <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t shadow-lg px-6 py-3 flex items-center justify-between z-20">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{pendingChanges.size}</span>{" "}
                        unsaved {pendingChanges.size === 1 ? "change" : "changes"}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDiscard} disabled={saving}>
                            Discard Changes
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                        >
                            {saving ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                "Save & Apply Changes"
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Sample Inserts Modal */}
            <SampleInsertsModal
                open={sampleModal.open}
                onClose={() => setSampleModal((s) => ({ ...s, open: false }))}
                categoryId={sampleModal.categoryId}
                categoryName={sampleModal.categoryName}
            />
        </div>
    );
}
