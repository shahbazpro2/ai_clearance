"use client";

import { useAtomValue } from "jotai";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const TOTAL_STEPS = 6;

interface SetupProgressHeaderProps {
    /** Override step shown — used when the step hasn't been committed to the atom yet */
    stepOverride?: number;
}

export function SetupProgressHeader({ stepOverride }: SetupProgressHeaderProps) {
    const ctx = useAtomValue(retailerSetupContextAtom);
    const router = useRouter();

    const step = stepOverride ?? ctx?.currentStep ?? 1;
    const accountName = ctx?.accountName ?? "";
    const audienceName = ctx?.audienceName ?? "";

    return (
        <div className="bg-white border-b  z-20">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Back + breadcrumb */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.push("/retailer/audiences/setup/step")}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </button>
                        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                            <span className="truncate font-medium text-gray-700">{accountName}</span>
                            {audienceName && (
                                <>
                                    <span>/</span>
                                    <span className="truncate font-medium text-gray-700">{audienceName}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium text-gray-700">
                            Step {step} of {TOTAL_STEPS}
                        </span>
                        {/* Step dots */}
                        <div className="hidden sm:flex items-center gap-1.5">
                            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-2 rounded-full transition-all ${i + 1 < step
                                        ? "w-4 bg-primary"
                                        : i + 1 === step
                                            ? "w-4 bg-primary"
                                            : "w-2 bg-gray-200"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
