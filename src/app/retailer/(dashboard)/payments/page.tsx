"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "use-hook-api";
import { getDistributorStatsApi } from "@/api/retailer";
import type { Audience } from "@/api/finance";
import { FinanceAudienceChannelSelector } from "@/components/finance/FinanceAudienceChannelSelector";
import { PaymentsTab } from "@/components/finance/PaymentsTab";
import { CreditCard } from "lucide-react";

export default function RetailerPaymentsPage() {
    const [audiences, setAudiences] = useState<Audience[]>([]);
    const [accountInfo, setAccountInfo] = useState({ account_id: "", account_name: "" });
    const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    const [callStats, { loading }] = useApi({ errMsg: true });

    const fetchAudiences = () => callStats(getDistributorStatsApi(true), ({ data }: any) => {
        const fetched: Audience[] = (data?.audiences || []).map((audience: any) => ({
            ...audience,
            channels: (audience.channels || []).map((channel: any) => ({
                ...channel,
                channel_type: channel.channel_type || channel.name || "Channel",
            })),
        }));
        setAudiences(fetched);
        setAccountInfo({ account_id: data?.account_id || "", account_name: data?.account_name || "" });
        setSelectedAudienceIds(fetched.map((audience) => audience.audience_id));
        setSelectedChannelIds(fetched.flatMap((audience) => audience.channels.map((channel) => channel.channel_id)));
    });

    useEffect(() => { fetchAudiences(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const availableChannelIds = useMemo(() => audiences
        .filter((audience) => selectedAudienceIds.includes(audience.audience_id))
        .flatMap((audience) => audience.channels.map((channel) => channel.channel_id)), [audiences, selectedAudienceIds]);
    const finalChannelIds = selectedChannelIds.filter((id) => availableChannelIds.includes(id));
    const totalChannels = audiences.reduce((total, audience) => total + audience.channels.length, 0);

    if (!loading && audiences.length === 0) return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4"><CreditCard className="h-8 w-8 text-gray-400" /></div>
            <h2 className="text-lg font-semibold text-gray-900">No Payment Data Available</h2>
            <p className="text-sm text-gray-500 mt-1">Payments will appear when live audiences and channels are available.</p>
        </div>
    );

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                <p className="text-sm text-gray-500 mt-1">
                    View orders grouped by payment date across live audiences and channels.
                    {accountInfo.account_name && <> Account: <span className="font-medium text-gray-700">{accountInfo.account_name}</span></>}
                </p>
                <p className="text-xs text-gray-400 mt-1">{audiences.length} audiences · {totalChannels} channels</p>
            </div>
            <div className="mb-6">
                <FinanceAudienceChannelSelector audiences={audiences} loading={loading}
                    selectedAudienceIds={selectedAudienceIds} selectedChannelIds={selectedChannelIds}
                    onSelectAudienceIds={setSelectedAudienceIds} onSelectChannelIds={setSelectedChannelIds}
                    onRefresh={fetchAudiences} />
            </div>
            <PaymentsTab channelIds={finalChannelIds} source="retailer" />
        </main>
    );
}
