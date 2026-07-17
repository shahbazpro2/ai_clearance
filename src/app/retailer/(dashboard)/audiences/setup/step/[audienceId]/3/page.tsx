"use client";

import { use } from "react";
import { UserManagementStep3 } from "@/components/retailer/UserManagementStep3";

export default function Step3Page({
    params,
}: {
    params: Promise<{ audienceId: string }>;
}) {
    const { audienceId } = use(params);
    return <UserManagementStep3 audienceId={audienceId} />;
}
