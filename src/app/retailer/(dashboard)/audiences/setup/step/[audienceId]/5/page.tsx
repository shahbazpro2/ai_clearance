"use client";

import { use } from "react";
import { OMSAudienceDetails } from "@/components/retailer/OMSAudienceDetails";

export default function Step5Page({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);

    return <OMSAudienceDetails audienceId={audienceId} />;
}
