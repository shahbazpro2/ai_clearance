"use client";

import { BlockCategoriesPage } from "@/components/retailer/BlockCategoriesPage";

// TODO: make this dynamic — resolve from authenticated user's channel data
const STATIC_CHANNEL_ID = "a1NJx000000EVgfMAG";

export default function BlockCategoriesRoute() {
    return <BlockCategoriesPage channelId={STATIC_CHANNEL_ID} />;
}
