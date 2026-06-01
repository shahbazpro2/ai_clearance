"use client";

import { useAtomValue } from "jotai";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Lock } from "lucide-react";

export default function Step3PendingPage() {
    const ctx = useAtomValue(retailerSetupContextAtom);
    const userData = useMe();

    // Restrict access for retailer role
    if (userData && userData.role === "retailer") {
        return (
            <>
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto mt-12">
                        <Card>
                            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                                    <Lock className="h-8 w-8 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Access Restricted
                                </h2>
                                <p className="text-sm text-gray-600 max-w-xs">
                                    This page is only available for setup administrators. Please contact your account manager.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <SetupProgressHeader stepOverride={3} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-amber-100">
                                <Clock className="h-8 w-8 text-amber-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Setup In Progress
                            </h2>
                            <p className="text-sm text-gray-600 max-w-xs">
                                We're processing your audience setup. This step is coming soon. Please check back later.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Audience: <span className="font-medium">{ctx?.audienceName}</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
