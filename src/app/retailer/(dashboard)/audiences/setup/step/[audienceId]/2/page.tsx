"use client";

import { use } from "react";
import { BrandApprovalSettingsStep2 } from "@/components/retailer/BrandApprovalSettingsStep2";

export default function Step2Page({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);
    return <BrandApprovalSettingsStep2 audienceId={audienceId} />;
}
