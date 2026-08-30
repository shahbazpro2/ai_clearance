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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getBrandCategoriesApi,
    saveBrandApprovalSettingsApi,
} from "@/api/retailer";
import {
    AlertCircle,
    ChevronLeft,
    ExternalLink,
    Info,
    Lock,
    RefreshCw,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
    category_id: string;
    category_name: string;
    configured: boolean;
    category_mode: number | null;
    category_mode_label: string | null;
    notifications_enabled: boolean | null;
    automatically_approve: boolean | null;
}

interface CategoryDraft {
    category_mode: number | null;
    notifications_enabled: boolean;
    automatically_approve: boolean | null;
}

const categoryToDraft = (category: Category): CategoryDraft => ({
    category_mode: category.category_mode ?? null,
    notifications_enabled: category.notifications_enabled ?? false,
    automatically_approve: category.automatically_approve ?? null,
});

const draftsMatch = (left: CategoryDraft, right: CategoryDraft) =>
    left.category_mode === right.category_mode &&
    left.notifications_enabled === right.notifications_enabled &&
    left.automatically_approve === right.automatically_approve;

// ─── Component ────────────────────────────────────────────────────────────────

interface BrandApprovalSettingsPageProps {
    audienceId: string;
    channelId: string;
    /** Render without setup-flow chrome (progress header, back bar, role restriction, page header) */
    embedded?: boolean;
    /** Override the default "View Brands" navigation */
    onViewBrands?: (category: Category) => void;
}

export function BrandApprovalSettingsPage({
    audienceId,
    channelId,
    embedded = false,
    onViewBrands,
}: BrandApprovalSettingsPageProps) {
    const router = useRouter();
    const userData = useMe();

    const [categories, setCategories] = useState<Category[]>([]);
    const [drafts, setDrafts] = useState<Map<string, CategoryDraft>>(new Map());
    const [savingId, setSavingId] = useState<string | null>(null);

    const [callFetch, { loading, error }] = useApi({ errMsg: true });
    const [callSave] = useApi({ errMsg: true });

    const fetchCategories = useCallback(() => {
        callFetch(getBrandCategoriesApi(channelId), ({ data }: any) => {
            setCategories(data?.brand_categories ?? []);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelId]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

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

    const getEffective = (category: Category): CategoryDraft => {
        const draft = drafts.get(category.category_id);
        if (draft) return draft;
        return categoryToDraft(category);
    };

    const updateDraft = (categoryId: string, patch: Partial<CategoryDraft>) => {
        setDrafts((prev) => {
            const next = new Map(prev);
            const category = categories.find((c) => c.category_id === categoryId);
            if (!category) return prev;

            const original = categoryToDraft(category);
            const updated = { ...(next.get(categoryId) ?? original), ...patch };

            if (draftsMatch(updated, original)) {
                next.delete(categoryId);
            } else {
                next.set(categoryId, updated);
            }
            return next;
        });
    };

    const handleSave = (category: Category) => {
        const draft = drafts.get(category.category_id);
        if (
            !draft ||
            draft.category_mode === null ||
            draft.automatically_approve === null
        ) return;

        setSavingId(category.category_id);
        callSave(
            saveBrandApprovalSettingsApi({
                channel_id: channelId,
                category_id: category.category_id,
                category_mode: draft.category_mode,
                notifications_enabled: draft.notifications_enabled,
                automatically_approve: draft.automatically_approve,
            }),
            () => {
                setSavingId(null);
                setDrafts((prev) => {
                    const next = new Map(prev);
                    next.delete(category.category_id);
                    return next;
                });
                fetchCategories();
            },
            () => {
                setSavingId(null);
            }
        );
    };

    const handleViewBrands = (category: Category) => {
        if (onViewBrands) {
            onViewBrands(category);
            return;
        }
        const params = new URLSearchParams({
            category_name: category.category_name,
        });
        router.push(
            `/retailer/audiences/setup/step/${audienceId}/2/brand-approval/${channelId}/brands/${category.category_id}?${params.toString()}`
        );
    };

    const isSaving = savingId !== null;

    return (
        <div className={embedded ? "" : "min-h-screen bg-gray-50"}>
            {!embedded && (
                <>
                    <SetupProgressHeader stepOverride={2} />

                    {/* Back navigation bar */}
                    <div className="bg-white border-b sticky top-14 z-20">
                        <div className="container mx-auto px-4 py-3">
                            <button
                                onClick={() => router.push(`/retailer/audiences/setup/step/${audienceId}/2`)}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back to Brand Approval Settings
                            </button>
                        </div>
                    </div>
                </>
            )}

            <main className={embedded ? "" : "container mx-auto px-4 py-8"}>
                {!embedded ? (
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Brand Approval Settings</h1>
                            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                                Configure approval settings for all categories. Assigning a setting of &ldquo;Approve&rdquo; allows the brand to include your program in their campaigns.
                            </p>
                        </div>
                        <Button
                            onClick={fetchCategories}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Category Approval Settings
                        </h2>
                        <Button
                            onClick={fetchCategories}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                        <div className="py-16 flex items-center justify-center gap-2 text-sm text-gray-500">
                            <LoadingSpinner size="lg" />
                            Loading brand categories...
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <p className="text-sm text-red-600">Failed to load categories.</p>
                        <Button variant="outline" size="sm" onClick={fetchCategories}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && (
                    <>
                        {categories.length === 0 ? (
                            <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                                No categories found for this channel.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3">Category Name</th>
                                                <th className="px-4 py-3">Brand Status</th>
                                                <th className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1">
                                                        New Brands Default
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Info className="h-3.5 w-3.5 cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-sm normal-case font-normal">
                                                                    You will have 1 business day to configure the approval status of new brands added to the category. In the event you don&apos;t meet this deadline, your selected New Brand Default status will be automatically applied.
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </span>
                                                </th>
                                                <th className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1">
                                                        Category Notification
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Info className="h-3.5 w-3.5 cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs normal-case font-normal">
                                                                    Enable an email notification each time a brand is added to the category.
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </span>
                                                </th>
                                                <th className="px-4 py-3">Setup Status</th>
                                                <th className="px-4 py-3">Save Changes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((category) => {
                                                const effective = getEffective(category);
                                                const hasDraft = drafts.has(category.category_id);
                                                const canSave =
                                                    hasDraft &&
                                                    effective.category_mode !== null &&
                                                    effective.automatically_approve !== null;

                                                return (
                                                    <tr
                                                        key={category.category_id}
                                                        className="border-t hover:bg-gray-50 transition-colors"
                                                    >
                                                        {/* Category Name */}
                                                        <td className="px-4 py-3">
                                                            <span className="font-medium text-gray-900">
                                                                {category.category_name}
                                                            </span>
                                                            {hasDraft && (
                                                                <span className="ml-2 text-xs font-medium text-amber-600">
                                                                    unsaved
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Brand Status */}
                                                        <td className="px-4 py-3">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleViewBrands(category)}
                                                            >
                                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                                Configure Brands
                                                            </Button>
                                                        </td>

                                                        {/* New Brands Default */}
                                                        <td className="px-4 py-3 min-w-44">
                                                            <Select
                                                                value={
                                                                    effective.automatically_approve === null
                                                                        ? ""
                                                                        : effective.automatically_approve
                                                                          ? "approve"
                                                                          : "block"
                                                                }
                                                                onValueChange={(value) =>
                                                                    updateDraft(category.category_id, {
                                                                        automatically_approve: value === "approve",
                                                                    })
                                                                }
                                                            >
                                                                <SelectTrigger size="sm">
                                                                    <SelectValue placeholder="—" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="approve">Auto Approve</SelectItem>
                                                                    <SelectItem value="block">Auto Block</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>

                                                        {/* Category Notification */}
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={effective.notifications_enabled}
                                                                    onCheckedChange={(checked) =>
                                                                        updateDraft(category.category_id, {
                                                                            notifications_enabled: checked,
                                                                        })
                                                                    }
                                                                    aria-label={`Toggle notifications for ${category.category_name}`}
                                                                />
                                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                    {effective.notifications_enabled
                                                                        ? "Enabled"
                                                                        : "Disabled"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Setup Status */}
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className={
                                                                    category.configured
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-amber-100 text-amber-700"
                                                                }
                                                            >
                                                                {category.configured ? "Completed" : "Pending"}
                                                            </Badge>
                                                        </td>

                                                        {/* Save Changes */}
                                                        <td className="px-4 py-3">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSave(category)}
                                                                disabled={!canSave || isSaving}
                                                                className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                                                            >
                                                                {savingId === category.category_id ? (
                                                                    <>
                                                                        <LoadingSpinner size="sm" className="mr-1" />
                                                                        Saving...
                                                                    </>
                                                                ) : (
                                                                    "Save Changes"
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Info message */}
                        {categories.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 items-start">
                                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700">
                                    Configure brand statuses and select a New Brands Default before saving category changes.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
