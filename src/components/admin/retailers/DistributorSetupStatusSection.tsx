"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchRetailerAccountsUsersApi, updateChannelPlatformLiveStatusApi } from "@/api/admin";
import { RetailerAccount, RetailerStatus } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle2, RefreshCw, Search, ShieldCheck, Activity, Layers, AlertCircle } from "lucide-react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

interface FlattenedChannelRow {
  account_id: string;
  account_name: string;
  account_status: RetailerStatus;
  audience_id: string;
  audience_name: string;
  channel_id: string;
  channel_name: string;
  channel_type: string;
  channel_status: RetailerStatus;
  is_completed: boolean;
  brand_approval_completed: boolean;
  is_dc_setup_completed: boolean;
  monthly_projections_completed: boolean;
  oms_feed_received: boolean;
  platform_live: boolean;
  completed_steps: number;
  remaining_steps: number;
}

function StepStatusBadge({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span
        className="inline-flex items-center text-green-600"
        aria-label="Completed"
        title="Completed"
      >
        <CheckCircle2 className="h-5 w-5" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
      Incomplete
    </span>
  );
}

export function DistributorSetupStatusSection() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveFilter, setLiveFilter] = useState<"all" | "live" | "not_live">("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "completed" | "in_progress">("all");
  const [updatingChannelId, setUpdatingChannelId] = useState<string | null>(null);
  const [liveOverrides, setLiveOverrides] = useState<Record<string, boolean>>({});

  const [getAccounts, { data, fullRes, loading, error, onClearCaches }] = useApi({
    cache: "distributor-setup-status-accounts",
    fullRes: true,
  });

  const [updatePlatformLiveApi] = useApi({
    errMsg: true,
  });

  const getAccountsRef = useRef(getAccounts);
  getAccountsRef.current = getAccounts;

  const fetchData = useCallback(() => {
    onClearCaches?.(["distributor-setup-status-accounts"]);
    // Fetch accounts without small pagination limits so all distributor channels are available
    getAccountsRef.current(
      fetchRetailerAccountsUsersApi({
        page: 1,
        per_page: 100,
      })
    );
  }, [onClearCaches]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchData();
  }, [fetchData, mounted]);

  const accounts: RetailerAccount[] = useMemo(() => {
    const raw =
      (data?.data as RetailerAccount[]) ??
      (fullRes?.data as RetailerAccount[]) ??
      (data as RetailerAccount[]) ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [data, fullRes]);

  // Flatten accounts -> audiences -> channels into individual table rows
  const allRows: FlattenedChannelRow[] = useMemo(() => {
    const list: FlattenedChannelRow[] = [];

    for (const account of accounts) {
      for (const audience of account.audiences || []) {
        for (const channel of audience.channels || []) {
          const brandApproval = Boolean(channel.brand_approval_completed);
          const dcSetup = Boolean(channel.is_dc_setup_completed);
          const projections = Boolean(channel.monthly_projections_completed);
          const shipmentLogs = Boolean(channel.oms_feed_received);

          let completedCount = [brandApproval, dcSetup, projections, shipmentLogs].filter(
            Boolean
          ).length;

          // If individual step flags are absent but overall channel.is_completed is true
          if (completedCount === 0 && channel.is_completed) {
            completedCount = 4;
          }

          const remainingCount = Math.max(0, 4 - completedCount);
          const basePlatformLive = Boolean(channel.platform_live);
          const effectivePlatformLive =
            liveOverrides[channel.channel_id] !== undefined
              ? liveOverrides[channel.channel_id]
              : basePlatformLive;

          list.push({
            account_id: account.account_id,
            account_name: account.account_name || "Unknown Distributor",
            account_status: account.status || "active",
            audience_id: audience.audience_id,
            audience_name: audience.name || "Default Audience",
            channel_id: channel.channel_id,
            channel_name: channel.name,
            channel_type: channel.channel_type || channel.name || "Channel",
            channel_status: channel.status || "active",
            is_completed: Boolean(channel.is_completed),
            brand_approval_completed: brandApproval,
            is_dc_setup_completed: dcSetup,
            monthly_projections_completed: projections,
            oms_feed_received: shipmentLogs,
            platform_live: effectivePlatformLive,
            completed_steps: completedCount,
            remaining_steps: remainingCount,
          });
        }
      }
    }

    return list;
  }, [accounts, liveOverrides]);

  // Filter rows based on search, live status, and progress
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName =
          row.account_name.toLowerCase().includes(q) ||
          row.audience_name.toLowerCase().includes(q) ||
          row.channel_type.toLowerCase().includes(q) ||
          row.channel_name.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      // Platform Live filter
      if (liveFilter === "live" && !row.platform_live) return false;
      if (liveFilter === "not_live" && row.platform_live) return false;

      // Progress filter
      if (progressFilter === "completed" && row.completed_steps < 4) return false;
      if (progressFilter === "in_progress" && row.completed_steps >= 4) return false;

      return true;
    });
  }, [allRows, searchQuery, liveFilter, progressFilter]);

  // Handle toggling 12.1 Update Channel Platform Live Status
  const handleTogglePlatformLive = (channelId: string, newValue: boolean) => {
    setUpdatingChannelId(channelId);

    // Optimistically update
    setLiveOverrides((prev) => ({ ...prev, [channelId]: newValue }));

    updatePlatformLiveApi(
      updateChannelPlatformLiveStatusApi({
        channel_id: channelId,
        platform_live: newValue,
      }),
      () => {
        toast.success(`Platform Live set to ${newValue ? "Live" : "Not Live"}`);
        setUpdatingChannelId(null);
        fetchData();
      },
      (err: any) => {
        // Rollback on failure
        setLiveOverrides((prev) => {
          const next = { ...prev };
          delete next[channelId];
          return next;
        });
        const msg = err?.message || err?.data?.message || "Failed to update Platform Live status";
        toast.error(msg);
        setUpdatingChannelId(null);
      }
    );
  };

  // KPI counts
  const totalChannels = allRows.length;
  const liveChannels = allRows.filter((r) => r.platform_live).length;
  const completedChannels = allRows.filter((r) => r.completed_steps === 4).length;
  const pendingChannels = totalChannels - completedChannels;

  if (!mounted) return null;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Distributor Setup Status</h2>
          <p className="text-sm text-gray-500">
            Monitor setup progress and manage Platform Live availability across all distributor channels.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="whitespace-nowrap self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Layers className="h-4 w-4 text-gray-400" />
            Total Channels
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{totalChannels}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
            <Activity className="h-4 w-4 text-green-600" />
            Platform Live
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600">{liveChannels}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Fully Setup (4/4)
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{completedChannels}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Setup Incomplete
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingChannels}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by distributor, audience, or channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={liveFilter}
          onValueChange={(val) => setLiveFilter(val as "all" | "live" | "not_live")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Platform Live" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platform Statuses</SelectItem>
            <SelectItem value="live">Platform Live</SelectItem>
            <SelectItem value="not_live">Platform Not Live</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={progressFilter}
          onValueChange={(val) => setProgressFilter(val as "all" | "completed" | "in_progress")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Setup Progress" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Progress Levels</SelectItem>
            <SelectItem value="completed">Completed (4/4)</SelectItem>
            <SelectItem value="in_progress">Incomplete (&lt; 4)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table (Channel Setup Style adapted for Admin) */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Distributor</th>
                <th className="px-4 py-3">Audience Name</th>
                <th className="px-4 py-3">Channel Name</th>
                <th className="px-4 py-3 text-center">Brand Approval</th>
                <th className="px-4 py-3 text-center">Distribution Centers</th>
                <th className="px-4 py-3 text-center">Monthly Projections</th>
                <th className="px-4 py-3 text-center">Shipment Logs</th>
                <th className="px-4 py-3">Setup Progress</th>
                <th className="px-4 py-3">Platform Live</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                      <LoadingSpinner size="lg" />
                      Loading distributor setup status…
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-red-600 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <p>Failed to load distributor channels setup data.</p>
                      <Button variant="outline" size="sm" onClick={fetchData}>
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-gray-500">
                    No distributor channels found matching your criteria.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredRows.map((row) => {
                  const isUpdating = updatingChannelId === row.channel_id;

                  return (
                    <tr
                      key={`${row.account_id}-${row.audience_id}-${row.channel_id}`}
                      className="border-t transition-colors hover:bg-gray-50/80"
                    >
                      {/* Distributor Account */}
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{row.account_name}</span>
                          <span className="text-[11px] text-gray-400 font-normal">
                            {row.account_id.slice(0, 8)}...
                          </span>
                        </div>
                      </td>

                      {/* Audience Name */}
                      <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                        {row.audience_name}
                      </td>

                      {/* Channel Name */}
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {row.channel_type}
                      </td>

                      {/* Step 1: Brand Approval */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <StepStatusBadge completed={row.brand_approval_completed} />
                        </div>
                      </td>

                      {/* Step 2: Distribution Centers */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <StepStatusBadge completed={row.is_dc_setup_completed} />
                        </div>
                      </td>

                      {/* Step 3: Monthly Projections */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <StepStatusBadge completed={row.monthly_projections_completed} />
                        </div>
                      </td>

                      {/* Step 4: Shipment Logs */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <StepStatusBadge completed={row.oms_feed_received} />
                        </div>
                      </td>

                      {/* Setup Progress */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.completed_steps === 4 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            4/4 Completed (0 remaining)
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1 min-w-[150px]">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span className="font-medium text-gray-800">
                                {row.completed_steps} of 4 Completed
                              </span>
                              <span className="text-gray-500">
                                {row.remaining_steps} remaining
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full transition-all",
                                  row.completed_steps > 0 ? "bg-primary" : "bg-transparent"
                                )}
                                style={{ width: `${(row.completed_steps / 4) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Platform Live Column */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={row.platform_live}
                            disabled={isUpdating}
                            onCheckedChange={(checked) =>
                              handleTogglePlatformLive(row.channel_id, checked)
                            }
                            aria-label={`Toggle Platform Live for ${row.channel_type}`}
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium px-2 py-0.5",
                              row.platform_live
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            {row.platform_live ? "Live" : "Not Live"}
                          </Badge>
                          {isUpdating && <LoadingSpinner size="sm" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
