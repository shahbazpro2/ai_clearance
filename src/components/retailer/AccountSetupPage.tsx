"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { getDistributorStatsApi } from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { retailerAudienceChannelSelectionAtomFamily } from "@/store/retailerAudienceChannel";
import { useMe } from "@/hooks/useMe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";

interface Channel {
    channel_id: string;
    name: string;
    channel_type: string;
    status: "active" | "inactive";
    is_completed: boolean;
    brand_approval_completed: boolean;
    is_dc_setup_completed: boolean;
    monthly_projections_completed: boolean;
    oms_feed_received: boolean;
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

type AudienceSetupStatus = "Pending" | "In Progress" | "Completed";

function getAudienceSetupStatus(audience: Audience): AudienceSetupStatus {
    if (audience.is_completed) return "Completed";
    if (audience.current_step > 1) return "In Progress";
    return "Pending";
}

function getStepPath(audienceId: string, step: number): string {
    if (step <= 1) return `/retailer/audiences/setup/step/${audienceId}/1`;
    if (step === 2) return `/retailer/audiences/setup/step/${audienceId}/2`;
    return `/retailer/audiences/setup/step/${audienceId}/${step}`;
}

function CompletionAction({ completed, onContinue }: { completed: boolean; onContinue: () => void }) {
    if (completed) {
        return (
            <span className="inline-flex items-center text-green-600" aria-label="Completed" title="Completed">
                <CheckCircle2 className="h-5 w-5" />
            </span>
        );
    }

    return (
        <Button size="sm" variant="outline" className="whitespace-nowrap" onClick={onContinue}>
            Continue Setup
        </Button>
    );
}

function ActiveBadge({ status }: { status: "active" | "inactive" }) {
    return (
        <Badge className={status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}

export function AccountSetupPage() {
    const router = useRouter();
    const userData = useMe();
    const setSetupCtx = useSetAtom(retailerSetupContextAtom);
    const setBrandApprovalSelection = useSetAtom(
        retailerAudienceChannelSelectionAtomFamily("brand-approval-settings"),
    );
    const setDistributionCenterSelection = useSetAtom(
        retailerAudienceChannelSelectionAtomFamily("distribution-centers"),
    );
    const setProjectionSelection = useSetAtom(
        retailerAudienceChannelSelectionAtomFamily("projection-shipment-logs"),
    );

    const [account, setAccount] = useState<AccountData | null>(null);
    const [fetchError, setFetchError] = useState(false);
    const [callFetch, { loading }] = useApi({ errMsg: true });

    const fetchStats = () => {
        setFetchError(false);
        callFetch(
            getDistributorStatsApi(),
            ({ data }: any) => {
                const accountData = data?.data ?? data;
                setAccount(accountData ?? null);
            },
            () => setFetchError(true),
        );
    };

    useEffect(() => {
        if (userData && ["retailer", "setup_user"].includes(userData.role)) {
            fetchStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData?.role]);

    if (!userData) {
        return (
            <main className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            </main>
        );
    }

    const setSetupContext = (audience: Audience, currentStep: number) => {
        if (!account) return;
        setSetupCtx({
            accountId: account.account_id,
            accountName: account.account_name,
            audienceId: audience.audience_id,
            audienceName: audience.name,
            currentStep,
        });
    };

    const handleSetupClick = (audience: Audience) => {
        setSetupContext(audience, audience.current_step);
        router.push(getStepPath(audience.audience_id, audience.current_step));
    };

    const moduleSelection = (audience: Audience, channel: Channel) => ({
        audienceId: audience.audience_id,
        channelId: channel.channel_id,
    });

    const handleBrandApprovalClick = (audience: Audience, channel: Channel) => {
        setBrandApprovalSelection(moduleSelection(audience, channel));
        router.push("/retailer/brand-approval-settings");
    };

    const handleDistributionCentersClick = (audience: Audience, channel: Channel) => {
        setDistributionCenterSelection(moduleSelection(audience, channel));
        router.push("/retailer/distribution-centers");
    };

    const handleMonthlyProjectionsClick = (audience: Audience, channel: Channel) => {
        setProjectionSelection(moduleSelection(audience, channel));
        router.push("/retailer/projection-shipment-logs");
    };

    const handleShipmentLogsClick = (audience: Audience) => {
        setSetupContext(audience, 6);
        router.push(`/retailer/audiences/setup/step/${audience.audience_id}/6`);
    };

    const programRows = account?.audiences.flatMap((audience) =>
        audience.channels.map((channel) => ({ audience, channel })),
    ) ?? [];

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Channel Setup</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Manage your distributor account and audience setup.
                </p>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            )}

            {!loading && fetchError && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <p className="text-sm text-red-600">Failed to load account data.</p>
                    <Button variant="outline" size="sm" onClick={fetchStats}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            )}

            {!loading && !fetchError && account && (
                <div className="space-y-8">
                    <Card>
                        <CardContent className="pt-5 pb-5">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                                Account Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Account Name</p>
                                    <p className="text-sm font-medium text-gray-900">{account.account_name}</p>
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

                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Program Setup Status ({account.audiences.length})
                        </h2>

                        {programRows.length === 0 ? (
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
                                                <th className="px-4 py-3">Channel Name</th>
                                                <th className="px-4 py-3">Brand Approval Settings</th>
                                                <th className="px-4 py-3">Distribution Centers</th>
                                                <th className="px-4 py-3">Monthly Projections</th>
                                                <th className="px-4 py-3">Shipment Logs</th>
                                                <th className="px-4 py-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {programRows.map(({ audience, channel }) => {
                                                const setupStatus = getAudienceSetupStatus(audience);
                                                const showButton = audience.status === "active" && setupStatus !== "Completed";

                                                return (
                                                    <tr key={`${audience.audience_id}-${channel.channel_id}`} className="border-t hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{audience.name}</td>
                                                        <td className="px-4 py-3">{channel.channel_type}</td>
                                                        <td className="px-4 py-3">
                                                            <CompletionAction
                                                                completed={channel.brand_approval_completed}
                                                                onContinue={() => handleBrandApprovalClick(audience, channel)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <CompletionAction
                                                                completed={channel.is_dc_setup_completed}
                                                                onContinue={() => handleDistributionCentersClick(audience, channel)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <CompletionAction
                                                                completed={channel.monthly_projections_completed}
                                                                onContinue={() => handleMonthlyProjectionsClick(audience, channel)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <CompletionAction
                                                                completed={channel.oms_feed_received}
                                                                onContinue={() => handleShipmentLogsClick(audience)}
                                                            />
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
