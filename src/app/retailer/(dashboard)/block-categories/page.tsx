"use client";

import { BlockCategoriesPage } from "@/components/retailer/BlockCategoriesPage";
import { AudienceChannelSelector } from "@/components/retailer/AudienceChannelSelector";
import { useAudienceChannel } from "@/hooks/useAudienceChannel";

export default function BlockCategoriesRoute() {
    const {
        audiences,
        selectedAudienceId,
        selectedChannelId,
        selectedAudience,
        loading,
        error,
        setSelectedChannelId,
        handleAudienceChange,
        refresh,
    } = useAudienceChannel();

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Block Categories</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage allowed and blocked categories for your channels.
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

            {selectedChannelId && (
                <BlockCategoriesPage channelId={selectedChannelId} hideHeader={true} />
            )}
        </main>
    );
}
