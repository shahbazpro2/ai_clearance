"use client";

import { use } from "react";
import { DistributionCenterChannelList } from "@/components/retailer/DistributionCenterChannelList";

export default function Step4Page({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);

    return <DistributionCenterChannelList audienceId={audienceId} />;
}
