"use client";

import { useRouter } from "next/navigation";
import { Settings2 } from "lucide-react";
import { BrandApprovalSettingsPage } from "@/components/retailer/BrandApprovalSettingsPage";
import { AudienceChannelSelector } from "@/components/retailer/AudienceChannelSelector";
import { useAudienceChannel } from "@/hooks/useAudienceChannel";

export default function BrandApprovalSettingsRoute() {
    const router = useRouter();
    const {
        audiences,
        selectedAudienceId,
        selectedChannelId,
        selectedAudience,
        refreshKey,
        loading,
        error,
        setSelectedChannelId,
        handleAudienceChange,
        refresh,
    } = useAudienceChannel("brand-approval-settings");

    return (
        <main className="container mx-auto px-4 py-8">
            {!loading && audiences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                        <Settings2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        No Audience Data Available
                    </h2>
                    <p className="text-sm text-gray-500 max-w-sm">
                        This section will become available once account setup is complete.
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Brand Approval Settings
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5 max-w-3xl">
                                Please configure your approval settings for all categories and brands.
                                Assigning a setting of &ldquo;Approve&rdquo; allows the brand to
                                include your program in their campaigns. Approval settings can be
                                changed at any time through the brand approval module in your dashboard.
                            </p>
                        </div>

                        <AudienceChannelSelector
                            audiences={audiences}
                            selectedAudienceId={selectedAudienceId}
                            selectedChannelId={selectedChannelId}
                            selectedAudience={selectedAudience}
                            loading={loading}
                            error={error}
                            onAudienceChange={handleAudienceChange}
                            onChannelChange={setSelectedChannelId}
                            onRefresh={refresh}
                        />
                    </div>

                    {selectedChannelId && selectedAudienceId && (
                        <BrandApprovalSettingsPage
                            key={`${selectedChannelId}-${refreshKey}`}
                            audienceId={selectedAudienceId}
                            channelId={selectedChannelId}
                            embedded
                            onViewBrands={(category) =>
                                router.push(
                                    `/retailer/brand-approval-settings/brands/${selectedChannelId}/${category.category_id}?category_name=${encodeURIComponent(category.category_name)}`
                                )
                            }
                        />
                    )}
                </>
            )}
        </main>
    );
}
