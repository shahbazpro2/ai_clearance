"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "use-hook-api";
import { fetchFinanceAudiencesApi, type Audience } from "@/api/finance";
import { FinanceLayoutWrapper } from "@/components/finance/FinanceLayoutWrapper";
import { FinanceAudienceChannelSelector } from "@/components/finance/FinanceAudienceChannelSelector";
import { OrdersTab } from "@/components/finance/OrdersTab";
import { PaymentsTab } from "@/components/finance/PaymentsTab";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CreditCard, ShoppingCart } from "lucide-react";

function FinancePortalContent() {
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<"orders" | "payments">(
        tabFromUrl === "payments" ? "payments" : "orders"
    );

    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [accountInfo, setAccountInfo] = useState<{ account_id: string; account_name: string } | null>(null);
    const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);

    const [callAudiencesApi, { loading: audiencesLoading }] = useApi({ both: false });

    const fetchAudiences = () => {
        callAudiencesApi(fetchFinanceAudiencesApi(), ({ data }: any) => {
            const fetchedAudiences: Audience[] = data?.audiences || [];
            setAudiences(fetchedAudiences);
            setAccountInfo({
                account_id: data?.account_id || "",
                account_name: data?.account_name || "",
            });
            // Default: select every audience and every channel so all data shows on load
            setSelectedAudienceIds(fetchedAudiences.map((a) => a.audience_id));
            const defaultChannelIds: string[] = [];
            for (const a of fetchedAudiences) {
                for (const c of a.channels) defaultChannelIds.push(c.channel_id);
            }
            setSelectedChannelIds(defaultChannelIds);
        });
    };

    useEffect(() => {
        fetchAudiences();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allChannelIds = useMemo(() => {
        const ids: string[] = [];
        for (const audience of audiences) {
            for (const channel of audience.channels) {
                ids.push(channel.channel_id);
            }
        }
        return ids;
    }, [audiences]);

    const channelIdsForSelectedAudiences = useMemo(() => {
        const ids: string[] = [];
        for (const audience of audiences) {
            if (!selectedAudienceIds.includes(audience.audience_id)) continue;
            for (const channel of audience.channels) {
                ids.push(channel.channel_id);
            }
        }
        return ids;
    }, [audiences, selectedAudienceIds]);

    const finalChannelIds = useMemo(
        () => selectedChannelIds.filter((id) => channelIdsForSelectedAudiences.includes(id)),
        [selectedChannelIds, channelIdsForSelectedAudiences]
    );

    const handleAudienceIdsChange = (ids: string[]) => {
        setSelectedAudienceIds(ids);
    };

    const handleChannelIdsChange = (ids: string[]) => {
        setSelectedChannelIds(ids);
    };

    const handleTabChange = (tab: "orders" | "payments") => {
        setActiveTab(tab);
    };

    const selectedChannelCount = finalChannelIds.length;
    const audienceCount = audiences.length;

    return (
        <FinanceLayoutWrapper activeTab={activeTab} onTabChange={handleTabChange}>
            <div className="container mx-auto px-4 py-8">
                {!audiencesLoading && audienceCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="rounded-full bg-gray-100 p-4 mb-4">
                            <CreditCard className="h-8 w-8 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            No Finance Data Available
                        </h2>
                        <p className="text-sm text-gray-500 max-w-sm">
                            This section will become available once audiences and channels are assigned
                            to your finance account.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <div className="flex items-start justify-between flex-col sm:flex-row gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {activeTab === "orders" ? "Orders" : "Payments"}
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {activeTab === "orders"
                                            ? "View orders and payment status across all authorized audiences and channels."
                                            : "View orders grouped by payment date with paid/unpaid summaries."}
                                        {accountInfo?.account_name && (
                                            <>
                                                {" "}Account:{" "}
                                                <span className="font-medium text-gray-700">
                                                    {accountInfo.account_name}
                                                </span>
                                                <span className="mx-2 text-gray-300">|</span>
                                                <span className="font-mono text-xs text-gray-500">
                                                    {accountInfo.account_id}
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <ShoppingCart className="h-4 w-4 text-gray-400" />
                                    <span>
                                        {audienceCount} audience{audienceCount !== 1 ? "s" : ""}
                                        <span className="mx-2 text-gray-300">•</span>
                                        {allChannelIds.length} channel
                                        {allChannelIds.length !== 1 ? "s" : ""} total
                                        {selectedChannelCount !== allChannelIds.length && (
                                            <>
                                                <span className="mx-2 text-gray-300">|</span>
                                                <span className="text-primary font-medium">
                                                    {selectedChannelCount} selected
                                                </span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <FinanceAudienceChannelSelector
                                audiences={audiences}
                                loading={audiencesLoading}
                                selectedAudienceIds={selectedAudienceIds}
                                selectedChannelIds={selectedChannelIds}
                                onSelectAudienceIds={handleAudienceIdsChange}
                                onSelectChannelIds={handleChannelIdsChange}
                                onRefresh={fetchAudiences}
                            />
                        </div>

                        <div>
                            {activeTab === "orders" ? (
                                <OrdersTab channelIds={finalChannelIds} />
                            ) : (
                                <PaymentsTab channelIds={finalChannelIds} />
                            )}
                        </div>
                    </>
                )}
            </div>
        </FinanceLayoutWrapper>
    );
}

export default function FinancePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-muted-foreground">Loading Finance Portal...</p>
                    </div>
                </div>
            }
        >
            <FinancePortalContent />
        </Suspense>
    );
}
