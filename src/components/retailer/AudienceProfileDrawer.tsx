"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import {
    audienceSetupStep1Api,
    fetchAudienceCategoriesApi,
    fetchAudienceProfileDataApi,
} from "@/api/retailer";
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, HelpCircle, RefreshCw } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Schema ───────────────────────────────────────────────────────────────────

// z.coerce.number() turns "" → 0 and skips the required check.
// Wrapping with preprocess catches empty strings before coercion.
const requiredNumber = (min: number, minMsg: string, max?: number) =>
    z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.coerce
            .number({ error: "Required" })
            .min(min, minMsg)
            .pipe(max !== undefined ? z.number().max(max, `Max ${max}`) : z.number())
    );

const schema = z.object({
    Category__c: z.string().min(1, "Category is required"),
    Website__c: z
        .string()
        .min(1, "Website is required")
        .refine(
            (val) => /^https?:\/\/.+/.test(val),
            "Must be a valid URL starting with http:// or https://"
        ),
    Age__c: requiredNumber(1, "Must be at least 1"),
    Income__c: requiredNumber(0, "Required"),
    Female__c: requiredNumber(0, "Required", 100),
    Male__c: requiredNumber(0, "Required", 100),
    Average_Order_Value__c: requiredNumber(0, "Required"),
    Monthly_New_Customer_Percentage__c: requiredNumber(0, "Required", 100),
    Annual_Customer_Order_Frequency__c: requiredNumber(0, "Required"),
});

type FormValues = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toFormValues(raw: Record<string, any>): Partial<FormValues> {
    return {
        Category__c: raw.Category__c != null ? String(raw.Category__c) : undefined,
        Website__c: raw.Website__c ?? undefined,
        Age__c: raw.Age__c ?? undefined,
        Income__c: raw.Income__c ?? undefined,
        Female__c: raw.Female__c ?? undefined,
        Male__c: raw.Male__c ?? undefined,
        Average_Order_Value__c: raw.Average_Order_Value__c ?? undefined,
        Monthly_New_Customer_Percentage__c: raw.Monthly_New_Customer_Percentage__c ?? undefined,
        Annual_Customer_Order_Frequency__c: raw.Annual_Customer_Order_Frequency__c ?? undefined,
    };
}

function hasChanges(current: Partial<FormValues>, original: Partial<FormValues>): boolean {
    const keys: (keyof FormValues)[] = [
        "Category__c",
        "Website__c",
        "Age__c",
        "Income__c",
        "Female__c",
        "Male__c",
        "Average_Order_Value__c",
        "Monthly_New_Customer_Percentage__c",
        "Annual_Customer_Order_Frequency__c",
    ];
    for (const key of keys) {
        const a = String(current[key] ?? "").trim();
        const b = String(original[key] ?? "").trim();
        if (a !== b) return true;
    }
    return false;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {message}
        </div>
    );
}

function HelpTooltip({ text }: { text: string }) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                        aria-label="More info"
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface AudienceProfileDrawerProps {
    open: boolean;
    audienceId: string | null;
    audienceName: string | null;
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AudienceProfileDrawer({
    open,
    audienceId,
    audienceName,
    onClose,
}: AudienceProfileDrawerProps) {
    // Tracks the original data fetched from the server (used for change detection)
    const originalDataRef = useRef<Partial<FormValues>>({});

    const [callFetchCategories, { data: categoriesData, loading: loadingCategories, error: categoriesError }] =
        useApi({ errMsg: true });
    const [callFetchProfile, { loading: loadingProfile, error: profileError }] =
        useApi({ errMsg: true });
    const [callSave, { loading: saving }] = useApi({
        both: true,
        resSuccessMsg: "Audience profile updated successfully.",
    });

    const {
        register,
        reset,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        mode: "onChange",
    });

    const watchedValues = watch();

    const isDirtyFromOriginal = hasChanges(watchedValues, originalDataRef.current);

    // ── Fetch data when drawer opens ──────────────────────────────────────────

    const fetchProfile = (id: string) => {
        callFetchProfile(
            fetchAudienceProfileDataApi({ audience_id: id }),
            ({ data }: any) => {
                const formData = data?.form_data ?? {};
                const normalized = toFormValues(formData);
                originalDataRef.current = normalized;
                reset(normalized as FormValues);
            }
        );
    };

    useEffect(() => {
        if (!open || !audienceId) return;
        // Reset form when a new audience is opened
        reset({} as FormValues);
        originalDataRef.current = {};
        // Fetch categories + profile in parallel
        callFetchCategories(fetchAudienceCategoriesApi("audience"));
        fetchProfile(audienceId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, audienceId]);

    // ── Categories ────────────────────────────────────────────────────────────

    const categories: any[] = (
        categoriesData?.data ?? categoriesData?.categories ?? categoriesData ?? []
    )
        .slice()
        .sort((a: any, b: any) => {
            const labelA = (a.category ?? a.name ?? a.label ?? "").toLowerCase();
            const labelB = (b.category ?? b.name ?? b.label ?? "").toLowerCase();
            return labelA.localeCompare(labelB);
        });

    // ── Save ──────────────────────────────────────────────────────────────────

    const onSubmit = (data: FormValues) => {
        if (!audienceId) return;
        callSave(
            audienceSetupStep1Api({
                audience_id: audienceId,
                current_step_name: "audience_data_collection",
                form_data: data,
            }),
            () => {
                // Refresh baseline so Save Changes disables again
                originalDataRef.current = toFormValues(data);
                reset(data);
            }
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:w-[700px] max-w-full p-0 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <SheetTitle className="text-lg font-bold text-gray-900">
                        Audience Profile
                    </SheetTitle>
                    {audienceName && (
                        <p className="text-sm text-gray-500 mt-0.5">
                            Audience:{" "}
                            <span className="font-medium text-gray-700">{audienceName}</span>
                        </p>
                    )}
                </SheetHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {loadingProfile ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500 text-sm">
                            <LoadingSpinner size="lg" />
                            Loading profile data…
                        </div>
                    ) : profileError ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <p className="text-sm text-red-600">Failed to load profile data.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => audienceId && fetchProfile(audienceId)}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    ) : (
                        <form id="audience-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Category */}
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                {loadingCategories ? (
                                    <div className="flex items-center gap-2 h-9 text-sm text-gray-500">
                                        <LoadingSpinner size="sm" /> Loading categories…
                                    </div>
                                ) : categoriesError ? (
                                    <p className="text-sm text-red-600 mt-1">
                                        Failed to load categories.
                                    </p>
                                ) : categories.length === 0 ? (
                                    <p className="text-sm text-gray-500 mt-1">
                                        No categories available.
                                    </p>
                                ) : (
                                    <Select
                                        disabled={saving}
                                        onValueChange={(val) =>
                                            setValue("Category__c", val, { shouldValidate: true, shouldDirty: true })
                                        }
                                        value={watch("Category__c") ?? ""}
                                    >
                                        <SelectTrigger aria-invalid={!!errors.Category__c}>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat: any) => (
                                                <SelectItem
                                                    key={cat.id ?? cat.category}
                                                    value={String(cat.id ?? cat.category)}
                                                >
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
                                    disabled={saving}
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
                                        disabled={saving}
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
                                        disabled={saving}
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
                                        disabled={saving}
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
                                        disabled={saving}
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
                                        disabled={saving}
                                    />
                                    <FieldError message={errors.Average_Order_Value__c?.message} />
                                </div>

                                {/* Monthly New Customer % */}
                                <div>
                                    <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                                        Monthly New Customer %{" "}
                                        <span className="text-red-500">*</span>
                                        <HelpTooltip text="What is your percentage of new first-time customers each month on average?" />
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="20"
                                        min={0}
                                        max={100}
                                        {...register("Monthly_New_Customer_Percentage__c")}
                                        aria-invalid={!!errors.Monthly_New_Customer_Percentage__c}
                                        disabled={saving}
                                    />
                                    <FieldError message={errors.Monthly_New_Customer_Percentage__c?.message} />
                                </div>

                                {/* Annual Customer Order Frequency */}
                                <div className="sm:col-span-2">
                                    <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                                        Annual Customer Order Frequency{" "}
                                        <span className="text-red-500">*</span>
                                        <HelpTooltip text="How many times does a customer order per year on average?" />
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="6"
                                        {...register("Annual_Customer_Order_Frequency__c")}
                                        aria-invalid={!!errors.Annual_Customer_Order_Frequency__c}
                                        disabled={saving}
                                    />
                                    <FieldError message={errors.Annual_Customer_Order_Frequency__c?.message} />
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer actions */}
                {!loadingProfile && !profileError && (
                    <div className="shrink-0 border-t px-6 py-4 flex items-center justify-end gap-3 bg-white">
                        <Button variant="outline" onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="audience-profile-form"
                            disabled={saving || !isDirtyFromOriginal || loadingProfile}
                            className="bg-blue-gradient text-white hover:bg-blue-gradient/90 min-w-32"
                        >
                            {saving ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Saving…
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
