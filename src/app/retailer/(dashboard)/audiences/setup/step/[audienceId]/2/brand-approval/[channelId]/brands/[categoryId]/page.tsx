"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryBrandsPage } from "@/components/retailer/CategoryBrandsPage";

export default function CategoryBrandsRoute({
    params,
}: {
    params: Promise<{ audienceId: string; channelId: string; categoryId: string }>;
}) {
    const { audienceId, channelId, categoryId } = use(params);
    const searchParams = useSearchParams();

    return (
        <CategoryBrandsPage
            audienceId={audienceId}
            channelId={channelId}
            categoryId={categoryId}
            categoryName={searchParams.get("category_name") ?? undefined}
        />
    );
}
