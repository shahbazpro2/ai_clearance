"use client";

import { use } from "react";
import { BrandApprovalSettingsPage } from "@/components/retailer/BrandApprovalSettingsPage";

export default function BrandApprovalChannelRoute({
    params,
}: {
    params: Promise<{ audienceId: string; channelId: string }>;
}) {
    const { audienceId, channelId } = use(params);
    return <BrandApprovalSettingsPage audienceId={audienceId} channelId={channelId} />;
}
