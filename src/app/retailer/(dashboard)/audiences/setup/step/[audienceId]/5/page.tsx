"use client";

import { use } from "react";
import { MonthlyShipmentProjectionsStep } from "@/components/retailer/MonthlyShipmentProjectionsStep";

export default function Step5Page({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);

  return <MonthlyShipmentProjectionsStep audienceId={audienceId} />;
}
