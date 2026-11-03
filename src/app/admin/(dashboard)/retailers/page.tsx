"use client";

import { fetchRetailerAccountsUsersApi, syncAllSalesforceRetailingApi, fetchSyncSalesforceJobStatsApi } from "@/api/admin";
import { RetailerAccountDetailView } from "@/components/admin/retailers/RetailerAccountDetailView";
import { RetailerAccountRow } from "@/components/admin/retailers/RetailerAccountRow";
import { MonthlyProjectionRequestsSection } from "@/components/admin/retailers/MonthlyProjectionRequestsSection";
import { DistributorSetupStatusSection } from "@/components/admin/retailers/DistributorSetupStatusSection";
import { SyncStatusDashboard } from "@/components/admin/retailers/SyncStatusDashboard";
import { RetailerAccount, RetailerStatus, UserStatus } from "@/components/admin/retailers/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/usePagination";
import { DEFAULT_PER_PAGE } from "@/lib/pagination";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "use-hook-api";

interface SyncJobStats {
  sync_job_id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  total_accounts_fetched: number;
  accounts_created: number;
  accounts_deactivated: number;
  total_users_fetched: number;
  users_created: number;
  users_deactivated: number;
  audiences_created: number;
  audiences_deactivated: number;
  total_audiences_fetched: number;
  channels_created: number;
  channels_deactivated: number;
  total_channels_fetched: number;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS: RetailerStatus[] = ["active", "inactive"];
const USER_STATUS_OPTIONS: UserStatus[] = ["active", "inactive"];

type ActiveTab = "accounts" | "projections" | "setup_status";

function RetailersManagementContent() {
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get("request_id");
  const openParam = searchParams.get("open");
  const tabParam = searchParams.get("tab");

  const shouldDefaultToProjections = Boolean(
    requestIdParam || openParam === "true" || tabParam === "projections"
  );
  const shouldDefaultToSetupStatus = Boolean(tabParam === "setup_status");

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    shouldDefaultToProjections
      ? "projections"
      : shouldDefaultToSetupStatus
      ? "setup_status"
      : "accounts"
  );

  useEffect(() => {
    if (requestIdParam || openParam === "true" || tabParam === "projections") {
      setActiveTab("projections");
    } else if (tabParam === "setup_status") {
      setActiveTab("setup_status");
    }
  }, [requestIdParam, openParam, tabParam]);

  const [accountStatusFilter, setAccountStatusFilter] = useState<RetailerStatus | "all">("all");
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatus | "all">("all");
  const [syncJobId, setSyncJobId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [getAccounts, { data, fullRes, loading, error }] = useApi({
    fullRes: true,
  });

  const [syncAll, { loading: syncing }] = useApi({
    both: true,
    resSuccessMsg: "Sync started successfully",
  });

  const [getSyncStats, { loading: refreshingStats, data: syncStatsData }] = useApi({ cache: "sync-stats" });

  const { page, paginationBarProps } = usePagination({
    pagination: fullRes?.pagination ?? data?.pagination ?? null,
    loading,
    resetPageWhen: `${accountStatusFilter}-${userStatusFilter}`,
  });

  const getAccountsRef = useRef(getAccounts);
  const getSyncStatsRef = useRef(getSyncStats);

  useEffect(() => {
    getAccountsRef.current = getAccounts;
  }, [getAccounts]);

  useEffect(() => {
    getSyncStatsRef.current = getSyncStats;
  }, [getSyncStats]);

  useEffect(() => {
    const params: any = { page, per_page: DEFAULT_PER_PAGE };
    if (accountStatusFilter !== "all") {
      params.status = accountStatusFilter;
    }
    if (userStatusFilter !== "all") {
      params.user_status = userStatusFilter;
    }
    getAccountsRef.current(fetchRetailerAccountsUsersApi(params));
  }, [accountStatusFilter, userStatusFilter, page]);

  const accounts: RetailerAccount[] = useMemo(() => {
    const raw = (data?.data as RetailerAccount[]) ?? (fullRes?.data as RetailerAccount[]) ?? (data as RetailerAccount[]) ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data, fullRes]);

  const selectedAccount = useMemo(() => {
    return accounts.find((account) => account.account_id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    const stats = data?.sync_job_stats ?? fullRes?.sync_job_stats ?? syncStatsData?.sync_job_stats;
    if (stats?.sync_job_id && !syncJobId) {
      setSyncJobId(stats.sync_job_id);
    }
  }, [data, fullRes, syncStatsData, syncJobId]);

  const syncStats: SyncJobStats | null = useMemo(() => {
    const stats = data?.sync_job_stats ?? fullRes?.sync_job_stats ?? syncStatsData?.sync_job_stats;
    return stats || null;
  }, [data, fullRes, syncStatsData]);

  const handleSyncAll = () => {
    syncAll(syncAllSalesforceRetailingApi(), (response: any) => {
      const jobId = response?.sync_job_id || response?.data?.sync_job_id;
      if (jobId) {
        setSyncJobId(jobId);
        getSyncStatsRef.current(fetchSyncSalesforceJobStatsApi(jobId));
      }
    });
  };

  const handleRefreshSyncStatus = () => {
    if (syncJobId) {
      getSyncStatsRef.current(fetchSyncSalesforceJobStatsApi(syncJobId));
    }
  };

  const refreshAccounts = () => {
    getAccountsRef.current(
      fetchRetailerAccountsUsersApi({
        page,
        per_page: DEFAULT_PER_PAGE,
        ...(accountStatusFilter !== "all" && { status: accountStatusFilter }),
        ...(userStatusFilter !== "all" && { user_status: userStatusFilter }),
      })
    );
  };

  if (selectedAccount) {
    return (
      <main className="min-h-screen w-full px-6 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h1 className="text-3xl font-bold">Distributors Management</h1>
          <Button
            onClick={handleSyncAll}
            disabled={syncing}
            className="whitespace-nowrap"
          >
            {syncing && <LoadingSpinner size="sm" />}
            <span className={syncing ? "ml-2" : ""}>
              {syncing ? "Syncing..." : "Sync With Salesforce"}
            </span>
          </Button>
        </div>

        <RetailerAccountDetailView
          account={selectedAccount}
          onBack={() => setSelectedAccountId(null)}
          onDeleted={refreshAccounts}
        />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-6">
        <Button
          onClick={handleSyncAll}
          disabled={syncing}
          className="whitespace-nowrap"
        >
          {syncing && <LoadingSpinner size="sm" />}
          <span className={syncing ? "ml-2" : ""}>
            {syncing ? "Syncing..." : "Sync With Salesforce"}
          </span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {(
            [
              { key: "accounts", label: "Distributor Accounts" },
              { key: "projections", label: "Monthly Projection Requests" },
              { key: "setup_status", label: "Distributor Setup Status" },
            ] as { key: ActiveTab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Retailer Accounts tab */}
      {activeTab === "accounts" && (
        <>
          <div className="mb-8">
            <SyncStatusDashboard
              stats={syncStats}
              onRefresh={handleRefreshSyncStatus}
              isRefreshing={refreshingStats}
            />
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <Select
              value={accountStatusFilter}
              onValueChange={(value) => setAccountStatusFilter(value as RetailerStatus | "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by account status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All account statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={userStatusFilter}
              onValueChange={(value) => setUserStatusFilter(value as UserStatus | "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by user status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All user statuses</SelectItem>
                {USER_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Account Id</th>
                    <th className="px-4 py-3">Account Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created At</th>
                    <th className="px-4 py-3">Updated At</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                          <LoadingSpinner size="lg" />
                          Fetching insert distributor accounts...
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-red-600">
                        Failed to load insert distributor accounts.
                      </td>
                    </tr>
                  )}

                  {!loading && !error && accounts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                        No insert distributor accounts found.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    accounts.map((account) => (
                      <RetailerAccountRow
                        key={account.account_id}
                        account={account}
                        onSelect={(selected) => setSelectedAccountId(selected.account_id)}
                        onDeleted={refreshAccounts}
                      />
                    ))}
                </tbody>
              </table>
            </div>
            <PaginationBar {...paginationBarProps} />
          </div>
        </>
      )}

      {/* Monthly Projection Requests tab */}
      {activeTab === "projections" && (
        <MonthlyProjectionRequestsSection
          targetRequestId={requestIdParam}
          autoOpen={openParam === "true" || (Boolean(requestIdParam) && openParam !== "false")}
        />
      )}

      {/* Distributor Setup Status tab */}
      {activeTab === "setup_status" && <DistributorSetupStatusSection />}
    </main>
  );
}

export default function RetailersManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <RetailersManagementContent />
    </Suspense>
  );
}
