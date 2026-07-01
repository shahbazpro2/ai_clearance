"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import {
    getAudienceChannelsApi,
    skipCategorySelectionApi,
    verifyCategorySelectionApi,
} from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RefreshCw, Lock, AlertCircle, ChevronLeft } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Channel {
    channel_id: string;
    name: string;
    channel_type: string;
    status: "active" | "inactive";
    category_exclusions_completed: boolean;
    created_at: string;
    updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
    try {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryExclusionsStep2Props {
    audienceId: string;
}

export function CategoryExclusionsStep2({ audienceId }: CategoryExclusionsStep2Props) {
    const router = useRouter();
    const userData = useMe();
    const ctx = useAtomValue(retailerSetupContextAtom);
    const setCtx = useSetAtom(retailerSetupContextAtom);

    const [channels, setChannels] = useState<Channel[]>([]);
    const [skippingId, setSkippingId] = useState<string | null>(null);

    const [callFetch, { loading, error }] = useApi({ errMsg: true });
    const [callSkip] = useApi({ errMsg: true });
    const [callVerify, { loading: verifying }] = useApi({ errMsg: true });

    const fetchChannels = () => {
        callFetch(getAudienceChannelsApi(audienceId), ({ data }: any) => {
            setChannels(data?.audience_channels ?? []);
        });
    };

    useEffect(() => {
        fetchChannels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audienceId]);

    // Restrict access for retailer role
    if (userData && userData.role === "retailer") {
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

    const allCompleted = channels.length > 0 && channels.every((c) => c.category_exclusions_completed);

    const handleSkip = (channelId: string) => {
        setSkippingId(channelId);
        callSkip(
            skipCategorySelectionApi({ channel_id: channelId }),
            () => {
                setChannels((prev) =>
                    prev.map((c) =>
                        c.channel_id === channelId ? { ...c, category_exclusions_completed: true } : c
                    )
                );
                setSkippingId(null);
            },
            () => {
                setSkippingId(null);
            }
        );
    };

    const handleSelectBlockCategory = (channel: Channel) => {
        // Navigate to block categories page with context in query params
        const params = new URLSearchParams({
            audience_id: audienceId,
            account_id: ctx?.accountId ?? "",
            from_setup: "true",
        });
        router.push(
            `/retailer/audiences/setup/step/${audienceId}/2/block-categories/${channel.channel_id}?${params.toString()}`
        );
    };

    const handleNext = () => {
        callVerify(
            verifyCategorySelectionApi({
                audience_id: audienceId,
                current_step_name: "blocked_categories_verification",
            }),
            ({ data }: any) => {
                const nextStep = data?.next_step ?? 3;
                if (ctx) {
                    setCtx({ ...ctx, currentStep: nextStep });
                }
                // Redirect to step 3 (pending page)
                router.push(`/retailer/audiences/setup/step/${audienceId}/${nextStep}`);
            }
        );
    };

    const handleBack = () => {
        if (ctx) {
            setCtx({ ...ctx, currentStep: 1 });
        }
        router.push(`/retailer/audiences/setup/step/${audienceId}/1`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <SetupProgressHeader stepOverride={2} />

            {/* Back navigation bar */}
            <div className="bg-white border-b sticky top-14 z-20">
                <div className="container mx-auto px-4 py-3">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Audience Profile
                    </button>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Category Exclusions</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            For each channel, allow all categories or select blocked categories.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={fetchChannels}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={channels.length === 0 || verifying}
                            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                        >
                            {verifying ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Verifying...
                                </>
                            ) : (
                                "Next"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                        <div className="py-16 flex items-center justify-center gap-2 text-sm text-gray-500">
                            <LoadingSpinner size="lg" />
                            Loading channels...
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <p className="text-sm text-red-600">Failed to load channels.</p>
                        <Button variant="outline" size="sm" onClick={fetchChannels}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && (
                    <>
                        {channels.length === 0 ? (
                            <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                                No channels found for this audience.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3">Channel</th>
                                                <th className="px-4 py-3">Completed</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Updated At</th>
                                                <th className="px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {channels.map((channel) => {
                                                /*   const showActions =
                                                      !channel.category_exclusions_completed && channel.status === "active"; */
                                                const showActions = true;

                                                const isSkipping = skippingId === channel.channel_id;

                                                return (
                                                    <tr
                                                        key={channel.channel_id}
                                                        className="border-t hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {channel.channel_type}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className={
                                                                    channel.category_exclusions_completed
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-amber-100 text-amber-700"
                                                                }
                                                            >
                                                                {channel.category_exclusions_completed ? "Completed" : "Pending"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className={
                                                                    channel.status === "active"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-gray-100 text-gray-500"
                                                                }
                                                            >
                                                                {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {formatDate(channel.updated_at)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {showActions && (
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleSkip(channel.channel_id)}
                                                                        disabled={isSkipping || !!skippingId}
                                                                    >
                                                                        {isSkipping ? (
                                                                            <>
                                                                                <LoadingSpinner size="sm" className="mr-1" />
                                                                                All Allowing...
                                                                            </>
                                                                        ) : (
                                                                            "Allow All Categories"
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleSelectBlockCategory(channel)}
                                                                        disabled={!!skippingId}
                                                                        className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                                                                    >
                                                                        Select Block Category
                                                                    </Button>
                                                                </div>
                                                            )}
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
                        {channels.length > 0 && !allCompleted && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 items-start">
                                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700">
                                    You can allow all categories for some channels, or select block categories for them. Use the refresh button to reload channel status after changes.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
