"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryBrandsPage } from "@/components/retailer/CategoryBrandsPage";

export default function CategoryBrandsRoute({
    params,
}: {
    params: Promise<{ channelId: string; categoryId: string }>;
}) {
    const { channelId, categoryId } = use(params);
    const searchParams = useSearchParams();

    return (
        <CategoryBrandsPage
            channelId={channelId}
            categoryId={categoryId}
            categoryName={searchParams.get("category_name") ?? undefined}
            embedded
            backHref="/retailer/brand-approval-settings"
        />
    );
}
