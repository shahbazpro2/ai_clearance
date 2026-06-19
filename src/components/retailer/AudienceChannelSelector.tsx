"use client";

import { RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Audience, AudienceChannel } from "@/hooks/useAudienceChannel";

interface AudienceChannelSelectorProps {
    audiences: Audience[];
    selectedAudienceId: string | null;
    selectedChannelId: string | null;
    selectedAudience: Audience | undefined;
    loading: boolean;
    error: unknown | null;
    onAudienceChange: (audienceId: string) => void;
    onChannelChange: (channelId: string) => void;
    onRefresh: () => void;
    /** Show status badges on channel chips (default true) */
    showChannelStatus?: boolean;
}

export function AudienceChannelSelector({
    audiences,
    selectedAudienceId,
    selectedChannelId,
    selectedAudience,
    loading,
    error,
    onAudienceChange,
    onChannelChange,
    onRefresh,
    showChannelStatus = true,
}: AudienceChannelSelectorProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* Selector card */}
            <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border">
                {/* Audience row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 shrink-0">Audience:</span>
                    {loading && !audiences.length ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <LoadingSpinner size="sm" /> Loading audiences…
                        </div>
                    ) : (
                        <Select value={selectedAudienceId ?? ""} onValueChange={onAudienceChange}>
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
                    <Button onClick={onRefresh} disabled={loading} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </div>

                {/* Channel chips */}
                {selectedAudience && (
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-700">Channel:</span>
                        <div className="flex flex-wrap gap-2">
                            {selectedAudience.channels.map((channel: AudienceChannel) => (
                                <button
                                    key={channel.channel_id}
                                    onClick={() => onChannelChange(channel.channel_id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                        selectedChannelId === channel.channel_id
                                            ? "bg-blue-gradient text-white"
                                            : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                                    )}
                                >
                                    {channel.name}
                                    {showChannelStatus && (
                                        <Badge
                                            className={cn(
                                                "ml-1.5",
                                                channel.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                            )}
                                        >
                                            {channel.status}
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Error state */}
            {!loading && !!error && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <p className="text-sm text-red-600">Failed to load account data.</p>
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            )}

            {/* No channels available */}
            {!loading && !error && selectedAudience && selectedAudience.channels.length === 0 && (
                <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                    No channels available for this audience.
                </div>
            )}
        </div>
    );
}
