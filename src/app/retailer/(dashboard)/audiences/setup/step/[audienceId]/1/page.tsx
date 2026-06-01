"use client";

import { use } from "react";
import { AudienceSetupStep1 } from "@/components/retailer/AudienceSetupStep1";

export default function AudienceSetupStep1Route({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);
    return <AudienceSetupStep1 audienceId={audienceId} />;
}
