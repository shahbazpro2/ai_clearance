"use client";

import { use } from "react";
import { CategoryExclusionsStep2 } from "@/components/retailer/CategoryExclusionsStep2";

export default function CategoryExclusionsStep2Route({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);
    return <CategoryExclusionsStep2 audienceId={audienceId} />;
}
