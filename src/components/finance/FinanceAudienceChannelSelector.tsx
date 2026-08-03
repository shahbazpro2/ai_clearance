"use client";

import { useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Search } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Audience, Channel } from "@/api/finance";

interface FinanceAudienceChannelSelectorProps {
    audiences: Audience[];
    loading?: boolean;
    selectedAudienceIds: string[];
    selectedChannelIds: string[];
    onSelectAudienceIds: (ids: string[]) => void;
    onSelectChannelIds: (ids: string[]) => void;
    onRefresh: () => void;
}

export function FinanceAudienceChannelSelector({
    audiences,
    loading = false,
    selectedAudienceIds,
    selectedChannelIds,
    onSelectAudienceIds,
    onSelectChannelIds,
    onRefresh,
}: FinanceAudienceChannelSelectorProps) {
    const [audienceSearch, setAudienceSearch] = useState("");
    const [channelSearch, setChannelSearch] = useState("");

    const allAudiencesSelected =
        audiences.length > 0 && selectedAudienceIds.length === audiences.length;

    const audiencesForChannels = useMemo(
        () => audiences.filter((a) => selectedAudienceIds.includes(a.audience_id)),
        [audiences, selectedAudienceIds]
    );

    const allChannelIds = useMemo(() => {
        const ids: string[] = [];
        for (const a of audiencesForChannels) {
            for (const c of a.channels) ids.push(c.channel_id);
        }
        return ids;
    }, [audiencesForChannels]);

    const allChannelOptions: (Channel & { audience_name: string; audience_id: string })[] = useMemo(() => {
        const list: (Channel & { audience_name: string; audience_id: string })[] = [];
        for (const a of audiencesForChannels) {
            for (const c of a.channels) {
                list.push({ ...c, audience_name: a.name, audience_id: a.audience_id });
            }
        }
        return list;
    }, [audiencesForChannels]);

    const effectiveSelectedChannelIds = useMemo(
        () => selectedChannelIds.filter((id) => allChannelIds.includes(id)),
        [selectedChannelIds, allChannelIds]
    );

    const allChannelsSelected =
        allChannelIds.length > 0 && effectiveSelectedChannelIds.length === allChannelIds.length;

    const filteredAudiences = useMemo(() => {
        if (!audienceSearch.trim()) return audiences;
        const q = audienceSearch.toLowerCase();
        return audiences.filter((a) => a.name.toLowerCase().includes(q));
    }, [audiences, audienceSearch]);

    const filteredChannels = useMemo(() => {
        if (!channelSearch.trim()) return allChannelOptions;
        const q = channelSearch.toLowerCase();
        return allChannelOptions.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.channel_type.toLowerCase().includes(q) ||
                c.audience_name.toLowerCase().includes(q)
        );
    }, [allChannelOptions, channelSearch]);

    // When the same channel type exists under multiple audiences, the chips look
    // identical unless we disambiguate them by audience name.
    const showAudienceName = useMemo(() => {
        const typeCounts = new Map<string, number>();
        for (const c of allChannelOptions) {
            typeCounts.set(c.channel_type, (typeCounts.get(c.channel_type) || 0) + 1);
        }
        return allChannelOptions.some((c) => (typeCounts.get(c.channel_type) || 0) > 1);
    }, [allChannelOptions]);

    // ---- Audience toggles (single multi-select dropdown) ----

    const toggleAudience = (audienceId: string) => {
        if (selectedAudienceIds.includes(audienceId)) {
            onSelectAudienceIds(selectedAudienceIds.filter((id) => id !== audienceId));
        } else {
            onSelectAudienceIds([...selectedAudienceIds, audienceId]);
        }
    };

    const toggleAllAudiences = () => {
        if (allAudiencesSelected) {
            onSelectAudienceIds([]);
        } else {
            onSelectAudienceIds(audiences.map((a) => a.audience_id));
        }
    };

    // ---- Channel toggles (click to select / click again to deselect) ----

    const toggleChannel = (channelId: string) => {
        if (selectedChannelIds.includes(channelId)) {
            onSelectChannelIds(selectedChannelIds.filter((id) => id !== channelId));
        } else {
            onSelectChannelIds([...selectedChannelIds, channelId]);
        }
    };

    const toggleAllChannels = () => {
        if (allChannelsSelected) {
            onSelectChannelIds([]);
        } else {
            onSelectChannelIds(allChannelIds);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border">
                {/* Audience row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 shrink-0">Audience:</span>
                    {loading && !audiences.length ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <LoadingSpinner size="sm" /> Loading audiences…
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Single multi-select audience dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                        className="w-[280px] justify-between"
                                    >
                                        <span className="truncate">
                                            {audiences.length === 0
                                                ? "No audiences"
                                                : allAudiencesSelected
                                                ? "All Audiences"
                                                : selectedAudienceIds.length === 0
                                                ? "Select audiences"
                                                : `${selectedAudienceIds.length} of ${audiences.length} selected`}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-72 p-0" align="start">
                                    <div className="p-3 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search audiences..."
                                                value={audienceSearch}
                                                onChange={(e) => setAudienceSearch(e.target.value)}
                                                className="pl-8 h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <DropdownMenuItem
                                        className="cursor-pointer p-3 border-b hover:bg-gray-50"
                                        onSelect={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleAllAudiences();
                                        }}
                                    >
                                        <Checkbox
                                            checked={allAudiencesSelected}
                                            className="mr-3"
                                            onCheckedChange={() => {}}
                                        />
                                        <span className="font-medium">All Audiences</span>
                                        <Badge className="ml-auto bg-gray-100 text-gray-500">
                                            {audiences.length}
                                        </Badge>
                                    </DropdownMenuItem>
                                    <DropdownMenuGroup className="max-h-64 overflow-y-auto">
                                        {filteredAudiences.map((audience) => {
                                            const checked = selectedAudienceIds.includes(audience.audience_id);
                                            return (
                                                <DropdownMenuItem
                                                    key={audience.audience_id}
                                                    className="cursor-pointer p-3 hover:bg-gray-50"
                                                    onSelect={(e) => e.preventDefault()}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleAudience(audience.audience_id);
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        className="mr-3"
                                                        onCheckedChange={() => {}}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{audience.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {audience.channels.length} channel
                                                            {audience.channels.length !== 1 ? "s" : ""}
                                                        </div>
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </DropdownMenuGroup>
                                    {filteredAudiences.length === 0 && (
                                        <div className="p-3 text-sm text-gray-400">
                                            No audiences match search
                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={onRefresh} disabled={loading} variant="outline" size="sm">
                                <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                    )}
                </div>

                {/* Channel chips row */}
                {audiencesForChannels.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                            <span className="text-sm font-medium text-gray-700">Channel:</span>
                            {allChannelOptions.length > 12 && (
                                <div className="relative w-full sm:w-60">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search channels..."
                                        value={channelSearch}
                                        onChange={(e) => setChannelSearch(e.target.value)}
                                        className="pl-7 h-8 text-sm"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={toggleAllChannels}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                    allChannelsSelected
                                        ? "bg-blue-gradient text-white"
                                        : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                                )}
                            >
                                All Channels
                                <Badge
                                    className={cn(
                                        "ml-1.5",
                                        allChannelsSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-gray-100 text-gray-500"
                                    )}
                                >
                                    {allChannelOptions.length}
                                </Badge>
                            </button>
                            {filteredChannels.map((channel) => {
                                const selected = selectedChannelIds.includes(channel.channel_id);
                                return (
                                    <button
                                        key={channel.channel_id}
                                        onClick={() => toggleChannel(channel.channel_id)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                            selected
                                                ? "bg-blue-gradient text-white"
                                                : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700"
                                        )}
                                        title={`${channel.audience_name} • ${channel.channel_type}`}
                                    >
                                        {channel.channel_type}
                                        {showAudienceName && channel.audience_name && (
                                            <span className="ml-1 font-normal opacity-80">
                                                · {channel.audience_name}
                                            </span>
                                        )}
                                        <Badge
                                            className={cn(
                                                "ml-1.5",
                                                selected
                                                    ? "bg-white/20 text-white"
                                                    : channel.status === "active"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                            )}
                                        >
                                            {channel.status}
                                        </Badge>
                                    </button>
                                );
                            })}
                            {filteredChannels.length === 0 && allChannelOptions.length > 0 && (
                                <span className="text-xs text-gray-400 self-center px-2">
                                    No channels match search
                                </span>
                            )}
                        </div>
                        {!allChannelsSelected && effectiveSelectedChannelIds.length > 0 && (
                            <div className="text-xs text-gray-500 pt-1">
                                {effectiveSelectedChannelIds.length} of {allChannelOptions.length} channel
                                {allChannelOptions.length !== 1 ? "s" : ""} selected
                            </div>
                        )}
                        {!allChannelsSelected &&
                            effectiveSelectedChannelIds.length === 0 &&
                            allChannelOptions.length > 0 && (
                                <div className="text-xs text-gray-500 pt-1">
                                    No channels selected — click channels above to filter
                                </div>
                            )}
                    </div>
                )}

                {/* No channels */}
                {!loading &&
                    audiencesForChannels.length > 0 &&
                    allChannelOptions.length === 0 && (
                        <div className="rounded-lg bg-white py-8 text-center text-sm text-gray-500 border">
                            No channels available for the selected audience
                            {selectedAudienceIds.length > 1 ? "s" : ""}.
                        </div>
                    )}
            </div>
        </div>
    );
}
