"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { getDistributorStatsApi } from "@/api/retailer";
import { BlockCategoriesPage } from "@/components/retailer/BlockCategoriesPage";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Types from API response
interface Channel {
    channel_id: string;
    name: string;
    status: string;
    is_completed: boolean;
}

interface Audience {
    audience_id: string;
    name: string;
    channels: Channel[];
}

interface AccountData {
    account_id: string;
    account_name: string;
    audiences: Audience[];
}

export default function BlockCategoriesRoute() {
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

    const [callFetch, { loading, error }] = useApi({ errMsg: true });

    const fetchAccountStats = () => {
        callFetch(getDistributorStatsApi(true), ({ data }: any) => {
            const accountData: AccountData = data?.data ?? data;
            const audienceList = accountData?.audiences ?? [];
            setAudiences(audienceList);

            if (audienceList.length > 0) {
                const firstAudience = audienceList[0];
                setSelectedAudienceId(firstAudience.audience_id);
                if (firstAudience.channels.length > 0) {
                    setSelectedChannelId(firstAudience.channels[0].channel_id);
                } else {
                    setSelectedChannelId(null);
                }
            }
        });
    };

    useEffect(() => {
        fetchAccountStats();
    }, []);

    const handleAudienceChange = (audienceId: string) => {
        setSelectedAudienceId(audienceId);
        const audience = audiences.find(a => a.audience_id === audienceId);
        if (audience?.channels.length) {
            setSelectedChannelId(audience.channels[0].channel_id);
        } else {
            setSelectedChannelId(null);
        }
    };

    const selectedAudience = audiences.find(a => a.audience_id === selectedAudienceId);

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Block Categories</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage allowed and blocked categories for your channels.
                    </p>
                </div>

                {/* Audience and Channel selection */}
                <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Audience:</span>
                        {loading && !audiences.length ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <LoadingSpinner size="sm" /> Loading audiences...
                            </div>
                        ) : (
                            <Select
                                value={selectedAudienceId ?? ""}
                                onValueChange={handleAudienceChange}
                            >
                                <SelectTrigger className="w-[250px]">
                                    <SelectValue placeholder="Select an audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    {audiences.map((audience) => (
                                        <SelectItem key={audience.audience_id} value={audience.audience_id}>
                                            {audience.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Button
                            onClick={fetchAccountStats}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Refresh
                        </Button>
                    </div>

                    {selectedAudience && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">Channel:</span>
                            <div className="flex flex-wrap gap-2">
                                {selectedAudience.channels.map((channel) => (
                                    <button
                                        key={channel.channel_id}
                                        onClick={() => setSelectedChannelId(channel.channel_id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedChannelId === channel.channel_id
                                                ? "bg-blue-gradient text-white"
                                                : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                                            }`}
                                    >
                                        {channel.name}
                                        <Badge
                                            className={`ml-1.5 ${channel.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {channel.status}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Error state */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <p className="text-sm text-red-600">Failed to load account data.</p>
                        <Button variant="outline" size="sm" onClick={fetchAccountStats}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                )}

                {/* No channel selected */}
                {!loading && !error && selectedAudience && !selectedChannelId && (
                    <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                        No channels available for this audience.
                    </div>
                )}
            </div>

            {/* Block Categories Page */}
            {selectedChannelId && (
                <BlockCategoriesPage channelId={selectedChannelId} hideHeader={true} />
            )}
        </main>
    );
}
