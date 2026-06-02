"use client";

import { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BlockCategoriesPage } from "@/components/retailer/BlockCategoriesPage";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function SetupBlockCategoriesRoute({
    params,
}: {
    params: Promise<{ audienceId: string; channelId: string }>;
}) {
    const { audienceId, channelId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromSetup = searchParams.get("from_setup") === "true";

    return (
        <div className="min-h-screen bg-gray-50">
            {fromSetup && <SetupProgressHeader stepOverride={2} />}

            {fromSetup && (
                <div className="container mx-auto px-4 pt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/retailer/audiences/setup/step/${audienceId}/2`)}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Channels
                    </Button>
                </div>
            )}

            <BlockCategoriesPage channelId={channelId} audienceId={audienceId} />
        </div>
    );
}
