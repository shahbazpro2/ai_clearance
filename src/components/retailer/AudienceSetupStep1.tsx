"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useSetAtom, useAtomValue } from "jotai";
import { audienceSetupStep1Api, fetchAudienceCategoriesApi, fetchAudienceProfileDataApi } from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, HelpCircle, Lock } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    Category__c: z.string().min(1, "Category is required"),
    Website__c: z.string().url().min(1, "Website is required"),
    Age__c: z.coerce.number({ error: "Required" }).min(1, "Required"),
    Income__c: z.coerce.number({ error: "Required" }).min(0, "Required"),
    Female__c: z.coerce
        .number({ error: "Required" })
        .min(0)
        .max(100, "Max 100"),
    Male__c: z.coerce
        .number({ error: "Required" })
        .min(0)
        .max(100, "Max 100"),
    Average_Order_Value__c: z.coerce.number({ error: "Required" }).min(0, "Required"),
    Monthly_New_Customer_Percentage__c: z.coerce
        .number({ error: "Required" })
        .min(0)
        .max(100, "Max 100"),
    Annual_Customer_Order_Frequency__c: z.coerce
        .number({ error: "Required" })
        .min(0, "Required"),
});

type FormData = z.infer<typeof schema>;

// ─── Help tooltip ─────────────────────────────────────────────────────────────

function HelpTooltip({ text }: { text: string }) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                    >
                        <HelpCircle className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                    {text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {message}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AudienceSetupStep1Props {
    audienceId: string;
}

export function AudienceSetupStep1({ audienceId }: AudienceSetupStep1Props) {
    const router = useRouter();
    const userData = useMe();
    const ctx = useAtomValue(retailerSetupContextAtom);
    const setCtx = useSetAtom(retailerSetupContextAtom);

    const [callFetchCategories, { data: categoriesData, loading: loadingCategories, error: categoriesError }] =
        useApi({ errMsg: true });
    const [callFetchProfile, { data: profileData, loading: loadingProfile }] =
        useApi({ errMsg: true });
    const [callSubmit, { loading: submitting }] = useApi({ errMsg: true });

    const {
        register,
        reset,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
        mode: "onChange",
    });

    // Shared pre-fill helper for cached or server data
    function prefillFormData(formData: Record<string, any>) {
        if (formData.Category__c !== undefined && formData.Category__c !== null) {
            setValue("Category__c", String(formData.Category__c), { shouldValidate: true });
        }
        if (formData.Website__c !== undefined && formData.Website__c !== null) {
            setValue("Website__c", formData.Website__c, { shouldValidate: true });
        }
        if (formData.Age__c !== undefined && formData.Age__c !== null) {
            setValue("Age__c", formData.Age__c, { shouldValidate: true });
        }
        if (formData.Income__c !== undefined && formData.Income__c !== null) {
            setValue("Income__c", formData.Income__c, { shouldValidate: true });
        }
        if (formData.Female__c !== undefined && formData.Female__c !== null) {
            setValue("Female__c", formData.Female__c, { shouldValidate: true });
        }
        if (formData.Male__c !== undefined && formData.Male__c !== null) {
            setValue("Male__c", formData.Male__c, { shouldValidate: true });
        }
        if (formData.Average_Order_Value__c !== undefined && formData.Average_Order_Value__c !== null) {
            setValue("Average_Order_Value__c", formData.Average_Order_Value__c, { shouldValidate: true });
        }
        if (formData.Monthly_New_Customer_Percentage__c !== undefined && formData.Monthly_New_Customer_Percentage__c !== null) {
            setValue("Monthly_New_Customer_Percentage__c", formData.Monthly_New_Customer_Percentage__c, { shouldValidate: true });
        }
        if (formData.Annual_Customer_Order_Frequency__c !== undefined && formData.Annual_Customer_Order_Frequency__c !== null) {
            setValue("Annual_Customer_Order_Frequency__c", formData.Annual_Customer_Order_Frequency__c, { shouldValidate: true });
        }
    }

    // On mount: pre-fill from client cache (going back), or fetch from server (continue setup)
    useEffect(() => {
        callFetchCategories(fetchAudienceCategoriesApi("audience"), () => {
            callFetchProfile(fetchAudienceProfileDataApi({ audience_id: audienceId }));
        })

        const cached = ctx?.stepData?.["1"];
        if (cached) {
            prefillFormData(cached);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When server profile data arrives, pre-fill the form
    useEffect(() => {
        const profilePayload = profileData?.data ?? profileData;
        const formData = profilePayload?.form_data;
        if (formData) {
            /* prefillFormData(formData); */
            reset(formData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileData]);

    // Restrict access for retailer role
    if (userData && userData.role === "retailer") {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="container mx-auto px-4 py-8 max-w-2xl">
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
            </div>
        );
    }

    const categories: any[] = (categoriesData?.categories ?? categoriesData ?? []).slice().sort((a: any, b: any) => {
        const labelA = (a.category ?? a.name ?? a.label ?? "").toLowerCase();
        const labelB = (b.category ?? b.name ?? b.label ?? "").toLowerCase();
        return labelA.localeCompare(labelB);
    });

    const onSubmit: SubmitHandler<FormData> = (data) => {
        callSubmit(
            audienceSetupStep1Api({
                audience_id: audienceId,
                current_step_name: "audience_data_collection",
                form_data: data,
            }),
            () => {
                // Cache form data and advance step in atom
                if (ctx) {
                    setCtx({
                        ...ctx,
                        currentStep: 2,
                        stepData: {
                            ...(ctx.stepData ?? {}),
                            "1": data,
                        },
                    });
                }
                router.push(`/retailer/audiences/setup/step/${audienceId}/2`);
            }
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <SetupProgressHeader stepOverride={1} />

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900">Audience Profile Setup</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Fill in the demographic and commerce data for this audience.
                    </p>
                </div>

                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Category */}
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            {loadingCategories ? (
                                <div className="flex items-center gap-2 h-9 text-sm text-gray-500">
                                    <LoadingSpinner size="sm" /> Loading categories...
                                </div>
                            ) : categoriesError ? (
                                <p className="text-sm text-red-600">Failed to load categories.</p>
                            ) : (
                                <Select
                                    onValueChange={(val) => setValue("Category__c", val, { shouldValidate: true })}
                                    value={watch("Category__c") ?? ""}
                                >
                                    <SelectTrigger aria-invalid={!!errors.Category__c}>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat: any) => (
                                            <SelectItem key={cat.id ?? cat.category} value={String(cat.id ?? cat.category)}>
                                                {cat.category ?? cat.name ?? cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <FieldError message={errors.Category__c?.message} />
                        </div>

                        {/* Website */}
                        <div>
                            <Label className="text-sm font-medium mb-1.5 block">
                                Website <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="https://example.com"
                                {...register("Website__c")}
                                aria-invalid={!!errors.Website__c}
                                disabled={submitting}
                            />
                            <FieldError message={errors.Website__c?.message} />
                        </div>

                        {/* Two-column numeric fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Age */}
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block">
                                    Age <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="35"
                                    {...register("Age__c")}
                                    aria-invalid={!!errors.Age__c}
                                    disabled={submitting}
                                />
                                <FieldError message={errors.Age__c?.message} />
                            </div>

                            {/* Income */}
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block">
                                    Income <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="75000"
                                    {...register("Income__c")}
                                    aria-invalid={!!errors.Income__c}
                                    disabled={submitting}
                                />
                                <FieldError message={errors.Income__c?.message} />
                            </div>

                            {/* Female % */}
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block">
                                    Female % <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="55"
                                    min={0}
                                    max={100}
                                    {...register("Female__c")}
                                    aria-invalid={!!errors.Female__c}
                                    disabled={submitting}
                                />
                                <FieldError message={errors.Female__c?.message} />
                            </div>

                            {/* Male % */}
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block">
                                    Male % <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="45"
                                    min={0}
                                    max={100}
                                    {...register("Male__c")}
                                    aria-invalid={!!errors.Male__c}
                                    disabled={submitting}
                                />
                                <FieldError message={errors.Male__c?.message} />
                            </div>

                            {/* Average Order Value */}
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block">
                                    Average Order Value <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="120"
                                    {...register("Average_Order_Value__c")}
                                    aria-invalid={!!errors.Average_Order_Value__c}
                                    disabled={submitting}
                                />
                                <FieldError message={errors.Average_Order_Value__c?.message} />
                            </div>

                            {/* Monthly New Customer % */}
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                                    Monthly New Customer % <span className="text-red-500">*</span>
                                    <HelpTooltip text="What is your percentage of new first-time customers each month on average?" />
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="20"
                                    min={0}
                                    max={100}
                                    {...register("Monthly_New_Customer_Percentage__c")}
                                    aria-invalid={!!errors.Monthly_New_Customer_Percentage__c}
                                    disabled={submitting}
                                />
                                <FieldError message={errors.Monthly_New_Customer_Percentage__c?.message} />
                            </div>

                            {/* Annual Customer Order Frequency */}
                            <div className="sm:col-span-2">
                                <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                                    Annual Customer Order Frequency <span className="text-red-500">*</span>
                                    <HelpTooltip text="How many times does a customer order per year on average?" />
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="6"
                                    {...register("Annual_Customer_Order_Frequency__c")}
                                    aria-invalid={!!errors.Annual_Customer_Order_Frequency__c}
                                    disabled={submitting}
                                />
                                <FieldError message={errors.Annual_Customer_Order_Frequency__c?.message} />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={submitting || loadingCategories || loadingProfile}
                                className="bg-blue-gradient text-white hover:bg-blue-gradient/90 min-w-28"
                            >
                                {submitting ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    "Continue"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
