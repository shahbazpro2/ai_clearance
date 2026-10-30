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
import { PaginationBar } from "@/components/ui/pagination-bar";
import { usePagination } from "@/hooks/usePagination";
import { CheckCircle2, RefreshCw, Search, ShieldCheck, Activity, Layers, AlertCircle } from "lucide-react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

const PER_PAGE_DEFAULT = 20;

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
  platform_live: boolean;
  brand_approval_completed: boolean;
  monthly_projections_completed: boolean;
  oms_feed_received: boolean;
  is_dc_setup_completed: boolean;
  completed_steps: number;
  remaining_steps: number;
}

function SetupStepStatusBadge({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs"
        title="Complete"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        Complete
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/80"
      title="Incomplete"
    >
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

  const [getAccounts, { data, fullRes, loading, error }] = useApi({
    fullRes: true,
  });

  const [updatePlatformLiveApi] = useApi({
    errMsg: true,
  });

  const { page, paginationBarProps } = usePagination({
    pagination: fullRes?.pagination ?? data?.pagination ?? null,
    loading,
    resetPageWhen: `${searchQuery}-${liveFilter}-${progressFilter}`,
  });

  const getAccountsRef = useRef(getAccounts);
  getAccountsRef.current = getAccounts;

  const fetchData = useCallback(() => {
    getAccountsRef.current(
      fetchRetailerAccountsUsersApi({
        include_channel_status: true,
        page,
        per_page: PER_PAGE_DEFAULT,
      })
    );
  }, [page]);

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
          const statusObj = (channel as any).setup_status || {};

          const platformLiveRaw =
            channel.platform_live !== undefined
              ? channel.platform_live
              : statusObj.platform_live;
          const basePlatformLive = Boolean(platformLiveRaw);
          const effectivePlatformLive =
            liveOverrides[channel.channel_id] !== undefined
              ? liveOverrides[channel.channel_id]
              : basePlatformLive;

          const brandApproval = Boolean(
            channel.brand_approval_completed !== undefined
              ? channel.brand_approval_completed
              : statusObj.brand_approval_completed
          );

          const monthlyProjections = Boolean(
            channel.monthly_projections_completed !== undefined
              ? channel.monthly_projections_completed
              : statusObj.monthly_projections_completed
          );

          const shipmentLogs = Boolean(
            channel.oms_feed_received !== undefined
              ? channel.oms_feed_received
              : statusObj.oms_feed_received
          );

          const dcSetup = Boolean(
            channel.is_dc_setup_completed !== undefined
              ? channel.is_dc_setup_completed
              : statusObj.is_dc_setup_completed
          );

          let completedCount = [brandApproval, dcSetup, monthlyProjections, shipmentLogs].filter(
            Boolean
          ).length;

          // If individual step flags are absent but overall channel.is_completed is true
          if (completedCount === 0 && channel.is_completed) {
            completedCount = 4;
          }

          const remainingCount = Math.max(0, 4 - completedCount);

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
            platform_live: effectivePlatformLive,
            brand_approval_completed: brandApproval,
            monthly_projections_completed: monthlyProjections,
            oms_feed_received: shipmentLogs,
            is_dc_setup_completed: dcSetup,
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
        toast.success(`Platform Live set to ${newValue ? "On" : "Off"}`);
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
            Platform Live (On)
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
            <SelectItem value="live">Platform Live (On)</SelectItem>
            <SelectItem value="not_live">Platform Not Live (Off)</SelectItem>
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
                <th className="px-4 py-3 text-center">Platform Live</th>
                <th className="px-4 py-3 text-center">Brand Approval</th>
                <th className="px-4 py-3 text-center">Monthly Projections</th>
                <th className="px-4 py-3 text-center">Shipment Logs</th>
                <th className="px-4 py-3 text-center">Distribution Centers</th>
                <th className="px-4 py-3">Setup Progress</th>
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

                      {/* Platform Live */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={row.platform_live}
                            disabled={isUpdating}
                            onCheckedChange={(checked) =>
                              handleTogglePlatformLive(row.channel_id, checked)
                            }
                            aria-label={`Toggle Platform Live for ${row.channel_name}`}
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-semibold px-2 py-0.5 min-w-[36px] justify-center",
                              row.platform_live
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            {row.platform_live ? "On" : "Off"}
                          </Badge>
                          {isUpdating && <LoadingSpinner size="sm" />}
                        </div>
                      </td>

                      {/* Step 1: Brand Approval */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <SetupStepStatusBadge completed={row.brand_approval_completed} />
                        </div>
                      </td>

                      {/* Step 2: Monthly Projections */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <SetupStepStatusBadge completed={row.monthly_projections_completed} />
                        </div>
                      </td>

                      {/* Step 3: Shipment Logs */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <SetupStepStatusBadge completed={row.oms_feed_received} />
                        </div>
                      </td>

                      {/* Step 4: Distribution Centers */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <SetupStepStatusBadge completed={row.is_dc_setup_completed} />
                        </div>
                      </td>

                      {/* Setup Progress */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.completed_steps === 4 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <PaginationBar {...paginationBarProps} />
      </div>
    </section>
  );
}
