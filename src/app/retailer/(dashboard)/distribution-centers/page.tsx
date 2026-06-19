"use client";

import { useState } from "react";
import { DistributionCenterForm } from "@/components/retailer/DistributionCenterForm";
import { AudienceChannelSelector } from "@/components/retailer/AudienceChannelSelector";
import { useAudienceChannel } from "@/hooks/useAudienceChannel";

export default function DistributionCentersRoute() {
    const [formKey, setFormKey] = useState(0);

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
                    <h1 className="text-2xl font-bold text-gray-900">Distribution Centers</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Select an audience and channel to manage distribution centers.
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
                <DistributionCenterForm
                    key={`${selectedChannelId}-${formKey}`}
                    audienceId={selectedAudienceId}
                    channelId={selectedChannelId}
                    allowRetailerRole={true}
                    onSaveSuccess={() => setFormKey((k) => k + 1)}
                />
            )}
        </main>
    );
}
