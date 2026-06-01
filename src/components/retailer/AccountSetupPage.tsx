"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { getDistributorStatsApi } from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Lock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Channel {
    channel_id: string;
    name: string;
    status: "active" | "inactive";
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

interface Audience {
    audience_id: string;
    name: string;
    status: "active" | "inactive";
    current_step: number;
    is_completed: boolean;
    is_live: boolean;
    channels: Channel[];
    created_at: string;
    updated_at: string;
}

interface AccountData {
    account_id: string;
    account_name: string;
    status: "active" | "inactive";
    is_account_setup_completed: boolean;
    audiences: Audience[];
    created_at: string;
    updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type AudienceSetupStatus = "Pending" | "In Progress" | "Completed";

function getAudienceSetupStatus(audience: Audience): AudienceSetupStatus {
    if (audience.is_completed) return "Completed";
    if (audience.current_step > 1) return "In Progress";
    return "Pending";
}

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

function getStepPath(audienceId: string, step: number): string {
    if (step <= 1) return `/retailer/audiences/setup/step/${audienceId}/1`;
    if (step === 2) return `/retailer/audiences/setup/step/${audienceId}/2`;
    // Future steps — fall back to last known
    return `/retailer/audiences/setup/step/${audienceId}/${step}`;
}

// ─── Status badges ────────────────────────────────────────────────────────────

function SetupStatusBadge({ status }: { status: AudienceSetupStatus }) {
    const cls =
        status === "Completed"
            ? "bg-green-100 text-green-700"
            : status === "In Progress"
                ? "bg-blue-100 text-blue-700"
                : "bg-amber-100 text-amber-700";
    return <Badge className={cls}>{status}</Badge>;
}

function ActiveBadge({ status }: { status: "active" | "inactive" }) {
    return (
        <Badge className={status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AccountSetupPage() {
    const router = useRouter();
    const userData = useMe();
    const setSetupCtx = useSetAtom(retailerSetupContextAtom);

    const [account, setAccount] = useState<AccountData | null>(null);
    const [fetchError, setFetchError] = useState(false);
    const [callFetch, { loading }] = useApi({ errMsg: true });

    const fetchStats = () => {
        setFetchError(false);
        callFetch(
            getDistributorStatsApi(),
            ({ data }: any) => {
                // Response shape: { data: { account_id, ... }, message, status }
                const accountData = data?.data ?? data;
                setAccount(accountData ?? null);
            },
            () => {
                setFetchError(true);
            }
        );
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Restrict access for retailer role
    if (userData && userData.role === "retailer") {
        return (
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
        );
    }

    const handleSetupClick = (audience: Audience) => {
        if (!account) return;
        // Persist context to atom so setup pages can read it
        setSetupCtx({
            accountId: account.account_id,
            accountName: account.account_name,
            audienceId: audience.audience_id,
            audienceName: audience.name,
            currentStep: audience.current_step,
        });
        router.push(getStepPath(audience.audience_id, audience.current_step));
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Account Setup</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Manage your retailer account and audience setup.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {/* Error */}
            {!loading && fetchError && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <p className="text-sm text-red-600">Failed to load account data.</p>
                    <Button variant="outline" size="sm" onClick={fetchStats}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            )}

            {/* Content */}
            {!loading && !fetchError && account && (
                <div className="space-y-8">
                    {/* ── Account Details ── */}
                    <Card>
                        <CardContent className="pt-5 pb-5">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                                Account Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Account Name</p>
                                    <p className="text-sm font-medium text-gray-900">{account.account_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Account ID</p>
                                    <p className="text-sm font-mono text-gray-700">{account.account_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Status</p>
                                    <ActiveBadge status={account.status} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Account Setup Status</p>
                                    <Badge
                                        className={
                                            account.is_account_setup_completed
                                                ? "bg-green-100 text-green-700"
                                                : "bg-amber-100 text-amber-700"
                                        }
                                    >
                                        {account.is_account_setup_completed ? "Completed" : "Incomplete"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Audience Table ── */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Audience Profiles ({account.audiences.length})
                        </h2>

                        {account.audiences.length === 0 ? (
                            <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                                No audience profiles linked to this account.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3">Audience Name</th>
                                                <th className="px-4 py-3">Audience ID</th>
                                                <th className="px-4 py-3">Setup Status</th>
                                                <th className="px-4 py-3">Current Step</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Live</th>
                                                <th className="px-4 py-3">Updated At</th>
                                                <th className="px-4 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {account.audiences.map((audience) => {
                                                const setupStatus = getAudienceSetupStatus(audience);
                                                const showButton =
                                                    audience.status === "active" && setupStatus !== "Completed";

                                                return (
                                                    <tr key={audience.audience_id} className="border-t hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {audience.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs font-mono text-gray-500">
                                                            {audience.audience_id}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <SetupStatusBadge status={setupStatus} />
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">
                                                            {audience.current_step}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <ActiveBadge status={audience.status} />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                className={
                                                                    audience.is_live
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-gray-100 text-gray-500"
                                                                }
                                                            >
                                                                {audience.is_live ? "Live" : "Not Live"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">
                                                            {formatDate(audience.updated_at)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {showButton && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleSetupClick(audience)}
                                                                    className={
                                                                        setupStatus === "Pending"
                                                                            ? "bg-blue-gradient text-white hover:bg-blue-gradient/90"
                                                                            : ""
                                                                    }
                                                                    variant={setupStatus === "In Progress" ? "outline" : "default"}
                                                                >
                                                                    {setupStatus === "Pending" ? "Start Setup" : "Continue Setup"}
                                                                </Button>
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
                    </div>
                </div>
            )}
        </main>
    );
}
