"use client";

import { use } from "react";
import { OMSAudienceDetails } from "@/components/retailer/OMSAudienceDetails";

export default function Step6Page({
  params,
}: {
  params: Promise<{ audienceId: string }>;
}) {
  const { audienceId } = use(params);

  return <OMSAudienceDetails audienceId={audienceId} />;
}
