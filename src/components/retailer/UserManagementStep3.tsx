"use client";

import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useSetAtom, useAtomValue } from "jotai";
import { verifyUserManagementStepApi } from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { UserManagementContent } from "@/components/retailer/UserManagementCore";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Lock } from "lucide-react";

interface UserManagementStep3Props {
    audienceId: string;
}

export function UserManagementStep3({ audienceId }: UserManagementStep3Props) {
    const router = useRouter();
    const userData = useMe();
    const ctx = useAtomValue(retailerSetupContextAtom);
    const setCtx = useSetAtom(retailerSetupContextAtom);
    const [callVerify, { loading: verifying }] = useApi({ errMsg: true });

    // ─── Access guard ─────────────────────────────────────────────────────────────

    if (userData && userData.role === "retailer") {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="container mx-auto px-4 py-8 max-w-2xl">
                    <div className="mt-12">
                        <Card>
                            <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                                    <Lock className="h-8 w-8 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
                                <p className="text-sm text-gray-600 max-w-xs">
                                    This page is only available for setup administrators. Please contact your account manager.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

    // ─── Handlers ────────────────────────────────────────────────────────────────

    const handleBack = () => {
        if (ctx) setCtx({ ...ctx, currentStep: 2 });
        router.push(`/retailer/audiences/setup/step/${audienceId}/2`);
    };

    const handleNext = () => {
        callVerify(
            verifyUserManagementStepApi(audienceId),
            ({ data }: any) => {
                const nextStep = data?.next_step ?? 4;
                if (ctx) setCtx({ ...ctx, currentStep: nextStep });
                router.push(`/retailer/audiences/setup/step/${audienceId}/${nextStep}`);
            }
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            <SetupProgressHeader stepOverride={3} />

            {/* Back navigation bar */}
            <div className="bg-white border-b sticky top-14 z-20">
                <div className="container mx-auto px-4 py-3">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Category Exclusions
                    </button>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Add and manage Stakeholder and Finance users for this account.
                    </p>
                </div>

                <div>
                    <UserManagementContent
                        audienceId={audienceId}
                        toolbar={
                            <Button
                                onClick={handleNext}
                                disabled={verifying}
                                className="bg-blue-gradient text-white hover:bg-blue-gradient/90 min-w-28"
                            >
                                {verifying ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Next"
                                )}
                            </Button>
                        }
                    />
                </div>
            </main>
        </div>
    );
}
