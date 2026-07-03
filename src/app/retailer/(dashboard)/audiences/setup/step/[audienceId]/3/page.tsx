"use client";

import { use } from "react";
import { FinancialContactStep3 } from "@/components/retailer/FinancialContactStep3";

export default function Step3Page({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);
    return <FinancialContactStep3 audienceId={audienceId} />;
}
