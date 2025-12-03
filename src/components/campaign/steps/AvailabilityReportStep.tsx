"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { useApi } from "use-hook-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import {
  selectedProgramsAtom,
  selectedCategoryAtom,
  classificationResultAtom,
} from "@/store/campaign";
import {
  getProgramAvailabilityApi,
  getInsertPrintTypesApi,
  getPrintPriceMatrixApi,
} from "../../../../api/campaigns";

interface AvailabilityReportStepProps {
  onBack: () => void;
  onComplete: () => void;
}

const DEFAULT_REPORT_MONTHS = ["december", "january", "february"];
const MONTH_ORDER: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};
const formatMonthLabel = (month: string) =>
  month.length ? month.charAt(0).toUpperCase() + month.slice(1) : month;

interface FreightRange {
  min: number;
  max?: number;
  value: number;
}

interface AvailabilityProgram {
  channel_id: string;
  program_name: string;
  availability_check_type: "instant" | "manual";
  media_rate: number;
  freightRanges: FreightRange[];
  monthlyAvailability: Record<string, number>;
  monthlyAvailabilityReasons: Record<string, string | null>;
  duration_disclaimer?: boolean;
  category?: string;
  exclusive?: boolean;
}

interface InsertPrintType {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
}

interface PrintPriceTier {
  min_quantity: number;
  max_quantity?: number;
  price_per_unit: number;
}

type BookingQuantity = Record<string, number | null | undefined>;
type QuantityErrorBag = Record<string, string | undefined>;
type BookingInputValues = Record<string, string | undefined>;
type BookingTouched = Record<string, boolean | undefined>;

const INCREMENT = 25000;

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US").format(value);
};

const getFreightForQuantity = (
  program: AvailabilityProgram,
  quantity: number
): number => {
  if (!quantity || !program.freightRanges.length) {
    return 0;
  }

  const directMatch = program.freightRanges.find(
    (range) =>
      quantity >= range.min &&
      (range.max === undefined || quantity <= range.max)
  );

  if (directMatch) {
    return directMatch.value;
  }

  const fallbackRange = [...program.freightRanges]
    .filter((range) => quantity >= range.min)
    .sort((a, b) => a.min - b.min)
    .pop();

  return fallbackRange?.value ?? 0;
};

const coerceToNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const parseQuantityToken = (token?: string): number | null => {
  if (!token) return null;
  const match = token.match(/(\d+(?:\.\d+)?)(k|m)?/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "k") value *= 1000;
  if (unit === "m") value *= 1000000;
  return Number.isFinite(value) ? value : null;
};

const interpretFreightKey = (
  key: string
): { min: number; max?: number } | null => {
  if (!key.startsWith("freight_")) return null;
  const payload = key.replace("freight_", "");
  const parts = payload.split("_").filter(Boolean);
  if (parts.length === 0) return null;

  const min = parseQuantityToken(parts[0]) ?? 0;
  const lastToken = parts[parts.length - 1]?.toLowerCase();

  if (lastToken === "plus") {
    return { min };
  }

  if (parts.length === 1) {
    // Single-value freight tiers should only match that exact quantity
    return { min, max: min };
  }

  const parsedMax = parts[1] ? parseQuantityToken(parts[1]) : undefined;
  return { min, max: parsedMax ?? undefined };
};

const extractFreightRanges = (
  metrics: Record<string, unknown> | undefined
): FreightRange[] => {
  if (!metrics || typeof metrics !== "object") return [];

  const ranges: FreightRange[] = [];

  Object.entries(metrics).forEach(([key, value]) => {
    if (!key.startsWith("freight_")) return;
    const numericValue = coerceToNumber(value);
    if (numericValue === null) return;
    const interpreted = interpretFreightKey(key);
    if (!interpreted) return;
    ranges.push({
      ...interpreted,
      value: numericValue,
    });
  });

  console.log('ranges', ranges);

  return ranges.sort((a, b) => a.min - b.min);
};

const buildMonthlyAvailability = (
  entries: any[]
): {
  quantities: Record<string, number>;
  reasons: Record<string, string | null>;
} => {
  const quantities: Record<string, number> = {};
  const reasons: Record<string, string | null> = {};

  entries.forEach((entry) => {
    const monthName =
      typeof entry?.month === "string" ? entry.month.toLowerCase() : "";
    if (!monthName) return;

    let value = 0;
    if (typeof entry?.available === "number") {
      value = entry.available;
    } else if (typeof entry?.available === "string") {
      const parsed = parseInt(entry.available, 10);
      value = Number.isNaN(parsed) ? 0 : parsed;
    } else if (typeof entry?.max_slot === "number") {
      value = entry.max_slot;
    } else if (entry?.available === true && typeof entry?.max_slot === "number") {
      value = entry.max_slot;
    }

    const reason =
      value === 0
        ? typeof entry?.reason === "string"
          ? entry.reason
          : typeof entry?.reason?.message === "string"
            ? entry.reason.message
            : null
        : null;

    quantities[monthName] = value;
    reasons[monthName] = reason;
  });

  return { quantities, reasons };
};

const normalizeAvailabilityProgram = (
  programData: any,
  fallbackChannelId?: string
): AvailabilityProgram | null => {
  if (!programData || typeof programData !== "object") return null;
  const channelId =
    programData.channel_id ??
    programData.program_id ??
    fallbackChannelId ??
    programData.id;

  if (!channelId) return null;

  const availabilityEntries = Array.isArray(programData.availability)
    ? programData.availability
    : [];
  const monthlyAvailabilityData = buildMonthlyAvailability(availabilityEntries);

  const metrics =
    (typeof programData.metrics === "object" && programData.metrics) || {};

  const resolvedMediaRate =
    coerceToNumber((metrics as Record<string, unknown>).media_rate) ??
    coerceToNumber(programData.media_rate) ??
    0;

  return {
    channel_id: channelId,
    program_name: programData.program_name ?? programData.name ?? channelId,
    availability_check_type:
      (programData.availability_check_type ??
        programData.instant_availability_check) === "instant"
        ? "instant"
        : "manual",
    media_rate: resolvedMediaRate,
    freightRanges: extractFreightRanges(metrics as Record<string, unknown>),
    monthlyAvailability: monthlyAvailabilityData.quantities,
    monthlyAvailabilityReasons: monthlyAvailabilityData.reasons,
    duration_disclaimer: Boolean(programData.duration_disclaimer),
    category: programData.category,
    exclusive: programData.exclusive,
  };
};

const getPrintRateForQuantity = (
  printMatrix: PrintPriceTier[],
  quantity: number
): number => {
  if (!printMatrix || printMatrix.length === 0 || !quantity) return 0;

  let matchedTier: PrintPriceTier | null = null;
  for (const tier of printMatrix) {
    if (
      quantity >= tier.min_quantity &&
      (tier.max_quantity === undefined || quantity <= tier.max_quantity)
    ) {
      matchedTier = tier;
    }
  }

  if (!matchedTier) {
    const smallestTier = printMatrix[0];
    if (smallestTier && quantity < smallestTier.min_quantity) {
      matchedTier = smallestTier;
    }
  }
  if (!matchedTier) return 0;
  return matchedTier.price_per_unit * quantity;
};

const getPrintPricePerUnit = (
  printMatrix: PrintPriceTier[],
  quantity: number
): number => {
  if (!printMatrix || printMatrix.length === 0 || !quantity) return 0;

  let matchedTier: PrintPriceTier | null = null;
  for (const tier of printMatrix) {
    if (
      quantity >= tier.min_quantity &&
      (tier.max_quantity === undefined || quantity <= tier.max_quantity)
    ) {
      matchedTier = tier;
    }
  }

  if (!matchedTier) {
    const smallestTier = printMatrix[0];
    if (smallestTier && quantity < smallestTier.min_quantity) {
      matchedTier = smallestTier;
    }
  }

  if (!matchedTier) return 0;
  return matchedTier.price_per_unit;
};

const normalizePrintMatrixData = (data: any): PrintPriceTier[] => {
  if (!data) return [];

  if (typeof data === "object") {
    const entries = Object.entries(data)
      .map(([key, value]) => {
        const min = Number(key);
        const price =
          typeof value === "number"
            ? value
            : typeof value === "string"
              ? Number(value)
              : NaN;
        if (!Number.isFinite(min) || !Number.isFinite(price)) {
          return null;
        }
        return { min, price };
      })
      .filter((item): item is { min: number; price: number } => Boolean(item))
      .sort((a, b) => a.min - b.min);

    return entries.map((entry, index) => {
      const next = entries[index + 1];
      return {
        min_quantity: entry.min,
        max_quantity: next ? next.min - 1 : undefined,
        price_per_unit: entry.price,
      };
    });
  }

  return [];
};

const validateQuantity = (
  value: string,
  maxAvailability: number
): { valid: boolean; error?: string; numericValue?: number | null } => {
  if (!value || value.trim() === "") {
    return { valid: true, numericValue: null };
  }

  const numValue = parseInt(value.replace(/,/g, ""), 10);
  if (isNaN(numValue)) {
    return { valid: false, error: "Must be a number" };
  }

  if (numValue < 0) {
    return { valid: false, error: "Cannot be negative" };
  }

  if (numValue % INCREMENT !== 0) {
    return {
      valid: false,
      error: `Must be in increments of ${formatNumber(INCREMENT)}`,
    };
  }

  if (numValue > maxAvailability) {
    return {
      valid: false,
      error: `Cannot exceed availability of ${formatNumber(maxAvailability)}`,
    };
  }

  return { valid: true, numericValue: numValue };
};

export function AvailabilityReportStep({
  onBack,
  onComplete,
}: AvailabilityReportStepProps) {
  const selectedPrograms = useAtomValue(selectedProgramsAtom);
  const selectedCategoryId = useAtomValue(selectedCategoryAtom);
  const classificationResult = useAtomValue(classificationResultAtom);

  const [selectedInsertType, setSelectedInsertType] = useState<string>("");
  const [bookingQuantities, setBookingQuantities] = useState<
    Record<string, BookingQuantity>
  >({});
  const [quantityErrors, setQuantityErrors] = useState<
    Record<string, QuantityErrorBag>
  >({});
  const [bookingInputValues, setBookingInputValues] = useState<
    Record<string, BookingInputValues>
  >({});
  const [bookingTouched, setBookingTouched] = useState<
    Record<string, BookingTouched>
  >({});

  const [
    callGetAvailability,
    { data: availabilityData, loading: loadingAvailability },
  ] = useApi({ errMsg: true });

  const [
    callGetPrintTypes,
    { data: printTypesData, loading: loadingPrintTypes },
  ] = useApi({ errMsg: true });

  const [
    callGetPrintMatrix,
    { data: printMatrixData, loading: loadingPrintMatrix },
  ] = useApi({ errMsg: true });

  const effectiveCategoryId = useMemo(() => {
    return (
      selectedCategoryId ??
      classificationResult?.predicted_category_id ??
      classificationResult?.predicted_category ??
      null
    );
  }, [selectedCategoryId, classificationResult]);

  // Fetch availability data on mount
  useEffect(() => {
    if (selectedPrograms.length > 0 && effectiveCategoryId) {
      callGetAvailability(
        getProgramAvailabilityApi({
          channel_ids: selectedPrograms,
          category_id: effectiveCategoryId,
        })
      );
    }
  }, [selectedPrograms, effectiveCategoryId, callGetAvailability]);

  // Fetch insert print types on mount
  useEffect(() => {
    callGetPrintTypes(getInsertPrintTypesApi());
  }, []);

  // Fetch print price matrix when insert type changes
  useEffect(() => {
    if (selectedInsertType) {
      callGetPrintMatrix(getPrintPriceMatrixApi(selectedInsertType));
    }
  }, [selectedInsertType]);

  const availabilityPrograms: AvailabilityProgram[] = useMemo(() => {
    const raw =
      (availabilityData as any)?.data ??
      (availabilityData as any)?.programs ??
      availabilityData ??
      [];

    const normalizedPrograms: AvailabilityProgram[] = [];

    if (Array.isArray(raw)) {
      raw.forEach((program) => {
        const normalized = normalizeAvailabilityProgram(program);
        if (normalized) {
          normalizedPrograms.push(normalized);
        }
      });
      return normalizedPrograms;
    }

    if (raw && typeof raw === "object") {
      Object.entries(raw).forEach(([channelId, value]) => {
        const normalized = normalizeAvailabilityProgram(value, channelId);
        if (normalized) {
          normalizedPrograms.push(normalized);
        }
      });
      return normalizedPrograms;
    }

    return normalizedPrograms;
  }, [availabilityData]);

  const reportMonths = useMemo(() => {
    const monthSet = new Set<string>();
    availabilityPrograms.forEach((program) => {
      Object.keys(program.monthlyAvailability).forEach((month) => {
        if (month) {
          monthSet.add(month);
        }
      });
    });
    const months = Array.from(monthSet);
    if (months.length === 0) {
      return DEFAULT_REPORT_MONTHS;
    }
    return months.sort((a, b) => {
      const orderA = MONTH_ORDER[a] ?? 999;
      const orderB = MONTH_ORDER[b] ?? 999;
      if (orderA === orderB) {
        return a.localeCompare(b);
      }
      return orderA - orderB;
    });
  }, [availabilityPrograms]);

  const insertPrintTypes: InsertPrintType[] = useMemo(() => {
    const raw =
      (printTypesData as any)?.data ??
      (printTypesData as any)?.types ??
      printTypesData ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [printTypesData]);

  const printMatrix: PrintPriceTier[] = useMemo(() => {
    const raw =
      printMatrixData ??
      null;
    return normalizePrintMatrixData(raw);
  }, [printMatrixData]);

  const handleQuantityChange = (
    programId: string,
    month: string,
    value: string
  ) => {
    setBookingInputValues((prev) => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        [month]: value,
      },
    }));

    const program = availabilityPrograms.find(
      (p) => p.channel_id === programId
    );
    if (!program) return;

    const maxAvailability = program.monthlyAvailability[month] ?? 0;

    if (maxAvailability <= 0) {
      setQuantityErrors((prev) => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          [month]: undefined,
        },
      }));
      setBookingQuantities((prev) => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          [month]: null,
        },
      }));
      setBookingInputValues((prev) => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          [month]: "",
        },
      }));
      return;
    }

    const validation = validateQuantity(value, maxAvailability);

    setQuantityErrors((prev) => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        [month]: validation.valid ? undefined : validation.error,
      },
    }));

    setBookingQuantities((prev) => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        [month]: validation.numericValue ?? null,
      },
    }));
  };

  const handleQuantityBlur = (programId: string, month: string) => {
    setBookingTouched((prev) => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        [month]: true,
      },
    }));
  };

  const getProgramTotalQuantity = (program: AvailabilityProgram): number => {
    const bookings = bookingQuantities[program.channel_id] || {};
    return reportMonths.reduce((sum, month) => {
      const qty = bookings[month];
      return sum + (qty ?? 0);
    }, 0);
  };

  const getTotalQuantityAcrossAllPrograms = (): number => {
    return availabilityPrograms.reduce((total, program) => {
      return total + getProgramTotalQuantity(program);
    }, 0);
  };

  const calculateTotalProgramAmount = (
    program: AvailabilityProgram
  ): number => {
    return (
      getMediaRateForProgram(program) +
      getPrintRateForProgram(program) +
      getFreightForProgram(program)
    );
  };

  const calculateTotalCampaignAmount = (): number => {
    return availabilityPrograms.reduce((total, program) => {
      return total + calculateTotalProgramAmount(program);
    }, 0);
  };

  const getPrintRateForProgram = (
    program: AvailabilityProgram
  ): number => {
    const programQuantity = getProgramTotalQuantity(program);
    if (programQuantity === 0) return 0;

    // Calculate total quantity across all programs and all months
    const totalQuantityAcrossAllPrograms = getTotalQuantityAcrossAllPrograms();

    // Get the price per unit based on the total quantity across all programs
    const pricePerUnit = getPrintPricePerUnit(printMatrix, totalQuantityAcrossAllPrograms);

    // Apply that price per unit to this program's quantity
    return pricePerUnit * programQuantity;
  };

  const getMediaRateForProgram = (program: AvailabilityProgram): number => {
    const totalQuantity = getProgramTotalQuantity(program);

    if (totalQuantity === 0) return 0;

    return (program.media_rate / 1000) * totalQuantity;
  };

  const getFreightForProgram = (program: AvailabilityProgram): number => {
    const totalQuantity = getProgramTotalQuantity(program);
    if (totalQuantity === 0) return 0;

    return getFreightForQuantity(program, totalQuantity);
  };

  const hasErrors = useMemo(() => {
    return Object.values(quantityErrors).some((errors) =>
      Object.values(errors).some((error) => error !== undefined)
    );
  }, [quantityErrors]);

  const isMonthUnavailable = (program: AvailabilityProgram, month: string) =>
    (program.monthlyAvailability[month] ?? 0) <= 0;

  const renderAvailabilityValue = (
    value: number,
    reason?: string | null,
    showDurationDisclaimer?: boolean
  ) => {
    const baseValue =
      value !== 0 || !reason ? (
        <span>{formatNumber(value)}</span>
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger className="cursor-help text-gray-900 underline decoration-dotted">
              {formatNumber(value)}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm text-gray-900">
              {reason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

    if (!showDurationDisclaimer) {
      return baseValue;
    }

    return (
      <div className="flex items-center justify-end gap-1">
        {baseValue}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm text-gray-900">
              Due to the size, this program may take 2-4 months to complete insert
              distribution.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Availability Report</h3>
            <p className="text-sm text-gray-600">
              Review availability and enter booking quantities for your selected programs.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back to Add More Programs
          </Button>
        </div>
      </div>

      {/* Step 1: Insert Type Selection */}
      <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Step 1
        </div>
        <h4 className="text-base font-semibold text-gray-900">Insert Type Selection</h4>
        <div>
          <label className="text-sm font-semibold text-gray-900">
            Select Insert Format:
          </label>
          <Select
            value={selectedInsertType}
            onValueChange={setSelectedInsertType}
            disabled={loadingPrintTypes}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select insert format" />
            </SelectTrigger>
            <SelectContent>
              {insertPrintTypes.map((type) => {
                const value =
                  type.id ??
                  type.code ??
                  type.name ??
                  type.label;
                if (!value) return null;
                const label = type.label ?? type.name ?? type.code ?? type.id ?? String(value);
                return (
                  <SelectItem key={String(value)} value={String(value)}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {loadingPrintTypes && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <LoadingSpinner size="sm" />
              Loading insert types...
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Availability Report Table */}
      {loadingAvailability ? (
        <div className="flex items-center justify-center rounded-xl border bg-white p-8">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-600">Loading availability data...</p>
          </div>
        </div>
      ) : availabilityPrograms.length === 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          No availability data available. Please go back and select programs.
        </div>
      ) : !selectedInsertType ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Please select an insert format to view the availability report.
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Step 2
          </div>
          <h4 className="text-base font-semibold text-gray-900">
            Availability Report Table
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                    Instant vs Manual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                    Program Name
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700">
                    Media Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700">
                    Print Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700">
                    Freight
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700">
                    Total Program Amount
                  </th>
                  {reportMonths.map((month) => (
                    <Fragment key={`header-${month}`}>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700">
                        {formatMonthLabel(month)} Availability
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-700">
                        {formatMonthLabel(month)} Booking Qty
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availabilityPrograms.map((program) => {
                  const bookings = bookingQuantities[program.channel_id] || {};
                  const errors = quantityErrors[program.channel_id] || {};
                  const inputValues = bookingInputValues[program.channel_id] || {};
                  const touched = bookingTouched[program.channel_id] || {};
                  const totalAmount = calculateTotalProgramAmount(program);

                  return (
                    <tr
                      key={program.channel_id}
                      className="border-b text-sm hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              program.availability_check_type === "instant"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {program.availability_check_type === "instant"
                              ? "Instant"
                              : "Manual"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {program.program_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(getMediaRateForProgram(program))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(getPrintRateForProgram(program))}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(getFreightForProgram(program))}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(totalAmount)}
                      </td>
                      {reportMonths.map((month) => {
                        const unavailable = isMonthUnavailable(program, month);
                        const bookingValue = bookings[month];
                        const inputValue = inputValues[month];
                        const error = errors[month];
                        const touchedValue = touched[month];
                        return (
                          <Fragment key={`${program.channel_id}-${month}`}>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {renderAvailabilityValue(
                                program.monthlyAvailability[month] ?? 0,
                                program.monthlyAvailabilityReasons[month],
                                program.duration_disclaimer
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <Input
                                  type="text"
                                  disabled={unavailable}
                                  value={
                                    unavailable
                                      ? ""
                                      : inputValue ??
                                      (bookingValue
                                        ? formatNumber(bookingValue)
                                        : "")
                                  }
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      program.channel_id,
                                      month,
                                      e.target.value
                                    )
                                  }
                                  onBlur={() =>
                                    handleQuantityBlur(program.channel_id, month)
                                  }
                                  placeholder="0"
                                  className={`w-32 text-right ${!unavailable && touchedValue && error
                                    ? "border-red-500"
                                    : ""
                                    }`}
                                />
                                {unavailable ? (
                                  <span className="mt-1 text-xs text-gray-500">
                                    No availability
                                  </span>
                                ) : (
                                  touchedValue &&
                                  error && (
                                    <span className="mt-1 text-xs text-red-600">
                                      {error}
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-right font-semibold text-gray-900">
            Total Campaign Amount:{" "}
            <span className="text-lg">
              {formatCurrency(calculateTotalCampaignAmount())}
            </span>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="flex items-center justify-end border-t pt-4">
        <Button
          className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
          onClick={onComplete}
          disabled={hasErrors || !selectedInsertType}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

