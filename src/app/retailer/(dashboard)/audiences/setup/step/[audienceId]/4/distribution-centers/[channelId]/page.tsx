"use client";

import { use } from "react";
import { DistributionCenterForm } from "@/components/retailer/DistributionCenterForm";

export default function DistributionCenterSetupPage({
    params,
}: {
    params: Promise<{ audienceId: string; channelId: string }>;
}) {
    const { audienceId, channelId } = use(params);

    return <DistributionCenterForm audienceId={audienceId} channelId={channelId} />;
}
