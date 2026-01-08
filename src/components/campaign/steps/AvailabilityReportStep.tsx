"use client";

import { Fragment, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useApi } from "use-hook-api";
import { useCampaignCache } from "@/hooks/useCampaignCache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Download, Trash2, Save, FileCheck, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  selectedProgramsAtom,
  selectedProgramIdsAtom,
  selectedCategoryAtom,
  classificationResultAtom,
  campaignIdAtom,
  availabilityReportBookingQuantitiesAtom,
  availabilityReportInputValuesAtom,
  availabilityReportQuantityErrorsAtom,
  availabilityReportBookingTouchedAtom,
  availabilityReportSelectedInsertTypeAtom,
  availabilityReportExcludedProgramsAtom,
} from "@/store/campaign";
import {
  getProgramAvailabilityApi,
  getInsertPrintTypesApi,
  getPrintPriceMatrixApi,
  saveCampaignProgramsApi,
  createManualAvailabilityRequestApi,
  getCampaignProgramsApi,
  verifyCampaignApi,
} from "../../../../api/campaigns";

interface AvailabilityReportStepProps {
  onBack: () => void;
  onComplete: () => void;
  useSavedPrograms?: boolean; // If true, use Get Campaign Programs API instead of Availability API
  isEditMode?: boolean; // If true, show Proceed to Booking and Reset Campaign buttons instead of Continue
  onProceedToBooking?: () => void;
  onResetCampaign?: () => void;
  resettingCampaign?: boolean;
  onSaveAndProceed?: (onSuccess: () => void) => void; // Callback to save programs before proceeding
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
  program_id?: string;
  program_name: string;
  availability_check_type: "instant" | "manual";
  media_rate: number;
  freightRanges: FreightRange[];
  monthlyAvailability: Record<string, number>;
  monthlyAvailabilityReasons: Record<string, string | null>;
  duration_disclaimer?: boolean;
  category?: string;
  exclusive?: boolean;
  reviewed_by_agency?: boolean;
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
  orderQuantities: Record<string, number>;
} => {
  const quantities: Record<string, number> = {};
  const reasons: Record<string, string | null> = {};
  const orderQuantities: Record<string, number> = {};

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

    // Extract order_qty from Get Campaign Programs API response
    let orderQty = 0;
    if (typeof entry?.order_qty === "number") {
      orderQty = entry.order_qty;
    } else if (typeof entry?.order_qty === "string") {
      const parsed = parseInt(entry.order_qty, 10);
      orderQty = Number.isNaN(parsed) ? 0 : parsed;
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
    if (orderQty > 0) {
      orderQuantities[monthName] = orderQty;
    }
  });

  return { quantities, reasons, orderQuantities };
};

const normalizeAvailabilityProgram = (
  programData: any,
  fallbackChannelId?: string
): AvailabilityProgram | null => {
  if (!programData || typeof programData !== "object") return null;

  // Try multiple possible field names for channel_id
  const channelId =
    programData.channel_id ??
    programData.channelId ??
    programData.program_id ??
    programData.programId ??
    fallbackChannelId ??
    programData.id ??
    programData._id;

  if (!channelId) {
    // Debug: Log when channelId cannot be found
    if (process.env.NODE_ENV === 'development') {
      console.warn('Cannot find channelId in program data:', programData);
    }
    return null;
  }

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

  // Extract program_id (different from channel_id)
  const programId = programData.id ?? programData.program_id ?? null;

  return {
    channel_id: channelId,
    program_id: programId ? String(programId) : undefined,
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
    reviewed_by_agency: Boolean(programData.reviewed_by_agency),
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

export interface AvailabilityReportStepRef {
  savePrograms: () => Promise<void>;
}

export const AvailabilityReportStep = forwardRef<AvailabilityReportStepRef, AvailabilityReportStepProps>(({
  onBack,
  onComplete,
  useSavedPrograms = false,
  isEditMode = false,
  onProceedToBooking,
  onResetCampaign,
  resettingCampaign = false,
}, ref) => {
  const { handleBackToHome } = useCampaignCache();
  const [selectedPrograms, setSelectedPrograms] = useAtom(selectedProgramsAtom);
  const [selectedProgramIds, setSelectedProgramIds] = useAtom(selectedProgramIdsAtom);
  const selectedCategoryId = useAtomValue(selectedCategoryAtom);
  const classificationResult = useAtomValue(classificationResultAtom);
  const campaignId = useAtomValue(campaignIdAtom);

  // Use cached state from atoms
  const [selectedInsertType, setSelectedInsertType] = useAtom(
    availabilityReportSelectedInsertTypeAtom
  );
  const [bookingQuantities, setBookingQuantities] = useAtom(
    availabilityReportBookingQuantitiesAtom
  );
  const [quantityErrors, setQuantityErrors] = useAtom(
    availabilityReportQuantityErrorsAtom
  );
  const [bookingInputValues, setBookingInputValues] = useAtom(
    availabilityReportInputValuesAtom
  );
  const [bookingTouched, setBookingTouched] = useAtom(
    availabilityReportBookingTouchedAtom
  );
  const [excludedPrograms, setExcludedPrograms] = useAtom(
    availabilityReportExcludedProgramsAtom
  );

  const [programToDelete, setProgramToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // State for verification error modal
  const [verificationError, setVerificationError] = useState<{
    message: string;
    hasDaysDifference: boolean;
  } | null>(null);

  const isDeletingRef = useRef(false);
  const skipRefetchRef = useRef(false);
  const prevSelectedProgramsLengthRef = useRef(selectedPrograms.length);

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

  const [callSavePrograms, { loading: savingPrograms }] = useApi({ errMsg: true });
  const [callRequestManualAvailability, { loading: requestingManualAvailability }] = useApi({ errMsg: true });
  const [callGetCampaignPrograms, { data: campaignProgramsData, loading: loadingCampaignPrograms }] = useApi({ errMsg: true });
  const [callVerifyCampaign, { loading: verifyingCampaign }] = useApi({ errMsg: false });

  // State to control RESET button visibility based on verification error
  const [showResetButton, setShowResetButton] = useState(false);

  // Reset showResetButton and verification error when campaignId changes
  useEffect(() => {
    setShowResetButton(false);
    setVerificationError(null);
  }, [campaignId]);

  // Reset showResetButton and verification error when reset completes successfully
  useEffect(() => {
    if (!resettingCampaign && showResetButton) {
      // Reset was completed, hide the button and clear error modal
      setShowResetButton(false);
      setVerificationError(null);
    }
  }, [resettingCampaign, showResetButton]);

  const effectiveCategoryId = useMemo(() => {
    return (
      selectedCategoryId ??
      classificationResult?.predicted_category_id ??
      classificationResult?.predicted_category ??
      null
    );
  }, [selectedCategoryId, classificationResult]);

  // Remove programs from excluded list if they're re-selected (but not during deletion)
  useEffect(() => {
    if (isDeletingRef.current) {
      // Don't reset the flag here - let the main useEffect handle it
      return;
    }
    if (selectedPrograms.length > 0 && excludedPrograms.length > 0) {
      setExcludedPrograms((prev) =>
        prev.filter((programId) => !selectedPrograms.includes(programId))
      );
    }
  }, [selectedPrograms, excludedPrograms.length, setExcludedPrograms]);

  // Fetch availability data on mount (but skip if we're deleting to prevent refetch)
  // Use Get Campaign Programs if useSavedPrograms is true AND no programs are selected, otherwise use Availability API
  useEffect(() => {
    const prevLength = prevSelectedProgramsLengthRef.current;
    const currentLength = selectedPrograms.length;

    // Detect if we just deleted a program: selectedPrograms went from > 0 to 0
    const justDeleted = prevLength > 0 && currentLength === 0;

    // Update ref for next comparison
    prevSelectedProgramsLengthRef.current = currentLength;

    // FIRST: Check if we're in the middle of deleting a program - don't reset flags yet
    if (skipRefetchRef.current || isDeletingRef.current) {
      return; // Exit early, don't reset flags or make API calls
    }

    // SECOND: Don't refetch if we just deleted (selectedPrograms went to 0) OR if selectedPrograms is empty and we have excluded programs
    // This prevents refetching when deleting the last record
    // This check must happen before any API calls
    if (justDeleted || (selectedPrograms.length === 0 && excludedPrograms.length > 0)) {
      return; // Exit early, don't make API calls
    }

    // THIRD: Now we can safely make API calls
    // If programs are selected from Program Selection page, always use Availability API
    if (selectedPrograms.length > 0 && effectiveCategoryId) {
      // Use Availability API when navigating from Program Selection page or when programs are selected
      callGetAvailability(
        getProgramAvailabilityApi({
          channel_ids: selectedPrograms,
          category_id: effectiveCategoryId,
          campaign_id: campaignId ?? undefined,
        })
      );
    } else if (useSavedPrograms && campaignId) {
      // Use Get Campaign Programs endpoint when directly landing on availability page with no selected programs
      // This happens in edit mode when user lands directly on availability page
      // But only if we don't have excluded programs (which would indicate we just deleted)
      if (excludedPrograms.length === 0) {
        callGetCampaignPrograms(getCampaignProgramsApi(campaignId));
      }
    } else if (!useSavedPrograms && selectedPrograms.length === 0 && effectiveCategoryId && campaignId) {
      // Fallback: If no programs selected but we have category and campaign, try to get saved programs
      // But only if we don't have excluded programs (which would indicate we just deleted)
      if (excludedPrograms.length === 0) {
        callGetCampaignPrograms(getCampaignProgramsApi(campaignId));
      }
    }
  }, [selectedPrograms, effectiveCategoryId, campaignId, callGetAvailability, callGetCampaignPrograms, useSavedPrograms, excludedPrograms.length]);

  // Reset deletion flags after excluded programs change (deletion complete)
  // Use a ref to track previous excluded programs length to detect when deletion completes
  const prevExcludedProgramsLengthRef = useRef(excludedPrograms.length);
  useEffect(() => {
    const prevLength = prevExcludedProgramsLengthRef.current;
    const currentLength = excludedPrograms.length;

    // If excluded programs increased (deletion happened), reset flags after React processes all updates
    if (currentLength > prevLength) {
      // Reset flags after a delay to ensure all useEffects have run
      const timer = setTimeout(() => {
        isDeletingRef.current = false;
        skipRefetchRef.current = false;
      }, 200);
      prevExcludedProgramsLengthRef.current = currentLength;
      return () => clearTimeout(timer);
    }

    prevExcludedProgramsLengthRef.current = currentLength;
  }, [excludedPrograms]);

  // Fetch insert print types on mount
  useEffect(() => {
    callGetPrintTypes(getInsertPrintTypesApi());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch print price matrix when insert type changes
  useEffect(() => {
    if (selectedInsertType) {
      callGetPrintMatrix(getPrintPriceMatrixApi(selectedInsertType));
    }
  }, [selectedInsertType, callGetPrintMatrix]);

  // Store raw program data for building payload
  const rawProgramDataMap = useRef<Map<string, any>>(new Map());
  const orderQuantitiesMap = useRef<Map<string, Record<string, number>>>(new Map());

  const availabilityPrograms: AvailabilityProgram[] = useMemo(() => {
    // Use campaign programs data if useSavedPrograms is true AND we have campaign programs data
    // Otherwise, fall back to availability data if available
    // This ensures we show data even if one source is empty
    let dataSource: any = null;
    if (useSavedPrograms && campaignProgramsData) {
      dataSource = campaignProgramsData;
    } else if (availabilityData) {
      dataSource = availabilityData;
    } else if (useSavedPrograms && !campaignProgramsData && !availabilityData) {
      // In edit mode, if no data yet, return empty array (will show loading)
      return [];
    } else {
      // No data available
      return [];
    }

    // Handle different response structures from availability API
    let raw: any = null;

    if (dataSource) {
      // Try different possible response structures
      if (Array.isArray(dataSource)) {
        raw = dataSource;
      } else if (Array.isArray((dataSource as any)?.data)) {
        raw = (dataSource as any).data;
      } else if (Array.isArray((dataSource as any)?.programs)) {
        raw = (dataSource as any).programs;
      } else if (Array.isArray((dataSource as any)?.results)) {
        raw = (dataSource as any).results;
      } else if (typeof (dataSource as any)?.data === "object" && (dataSource as any).data !== null) {
        // If data is an object (not array), try to extract programs from it
        const dataObj = (dataSource as any).data;
        if (Array.isArray(dataObj.programs)) {
          raw = dataObj.programs;
        } else if (Array.isArray(dataObj.results)) {
          raw = dataObj.results;
        } else {
          // Try treating the object itself as a collection
          raw = dataObj;
        }
      } else if (typeof dataSource === "object" && dataSource !== null) {
        // If the response itself is an object, check if it's a key-value map
        raw = dataSource;
      }
    }

    // Default to empty array if nothing found
    if (!raw) {
      raw = [];
    }

    // Debug: Log data source info in development
    if (process.env.NODE_ENV === 'development' && dataSource) {
      console.log('Availability Data Source:', {
        useSavedPrograms,
        hasCampaignProgramsData: !!campaignProgramsData,
        hasAvailabilityData: !!availabilityData,
        dataSourceType: typeof dataSource,
        rawType: typeof raw,
        rawIsArray: Array.isArray(raw),
        rawLength: Array.isArray(raw) ? raw.length : Object.keys(raw || {}).length,
        sampleData: Array.isArray(raw) && raw.length > 0 ? raw[0] : (typeof raw === 'object' ? Object.keys(raw).slice(0, 3) : null)
      });
    }

    const normalizedPrograms: AvailabilityProgram[] = [];
    rawProgramDataMap.current.clear();
    orderQuantitiesMap.current.clear();

    if (Array.isArray(raw)) {
      raw.forEach((program, index) => {
        const normalized = normalizeAvailabilityProgram(program);
        if (normalized) {
          normalizedPrograms.push(normalized);
          // Store raw data for payload building
          const channelId = normalized.channel_id;
          rawProgramDataMap.current.set(channelId, program);

          // Extract order quantities from availability entries
          const availabilityEntries = Array.isArray(program.availability) ? program.availability : [];
          const orderQuantities: Record<string, number> = {};
          availabilityEntries.forEach((entry: any) => {
            const monthName = typeof entry?.month === "string" ? entry.month.toLowerCase() : "";
            if (monthName && typeof entry?.order_qty === "number" && entry.order_qty > 0) {
              orderQuantities[monthName] = entry.order_qty;
            }
          });
          if (Object.keys(orderQuantities).length > 0) {
            orderQuantitiesMap.current.set(channelId, orderQuantities);
          }
        } else if (process.env.NODE_ENV === 'development') {
          // Debug: Log when normalization fails
          console.warn(`Failed to normalize program at index ${index}:`, program);
        }
      });
    } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      // Handle object/Map structure where keys are channel_ids
      Object.entries(raw).forEach(([channelId, value]) => {
        const normalized = normalizeAvailabilityProgram(value, channelId);
        if (normalized) {
          normalizedPrograms.push(normalized);
          // Store raw data for payload building
          rawProgramDataMap.current.set(normalized.channel_id, value);

          // Extract order quantities from availability entries
          const programData = value as any;
          const availabilityEntries = Array.isArray(programData.availability) ? programData.availability : [];
          const orderQuantities: Record<string, number> = {};
          availabilityEntries.forEach((entry: any) => {
            const monthName = typeof entry?.month === "string" ? entry.month.toLowerCase() : "";
            if (monthName && typeof entry?.order_qty === "number" && entry.order_qty > 0) {
              orderQuantities[monthName] = entry.order_qty;
            }
          });
          if (Object.keys(orderQuantities).length > 0) {
            orderQuantitiesMap.current.set(normalized.channel_id, orderQuantities);
          }
        }
      });
    }

    return normalizedPrograms;
  }, [availabilityData, campaignProgramsData, useSavedPrograms]);

  // Populate selectedPrograms from campaign programs data when in edit mode
  useEffect(() => {
    if (useSavedPrograms && campaignProgramsData && availabilityPrograms.length > 0 && selectedPrograms.length === 0) {
      // Extract channel_ids from the normalized programs
      const channelIds = availabilityPrograms.map(program => program.channel_id);
      if (channelIds.length > 0) {
        setSelectedPrograms(channelIds);
      }
    }
  }, [useSavedPrograms, campaignProgramsData, availabilityPrograms, selectedPrograms.length, setSelectedPrograms]);

  // Initialize booking quantities from order_qty when using Get Campaign Programs API
  useEffect(() => {
    if (useSavedPrograms && orderQuantitiesMap.current.size > 0) {
      const newQuantities: Record<string, Record<string, number>> = {};
      orderQuantitiesMap.current.forEach((orderQuantities, channelId) => {
        newQuantities[channelId] = { ...orderQuantities };
      });

      // Only set if there are new quantities and current quantities are empty for those programs
      setBookingQuantities((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        orderQuantitiesMap.current.forEach((orderQuantities, channelId) => {
          if (!updated[channelId] || Object.keys(updated[channelId]).length === 0) {
            updated[channelId] = { ...orderQuantities };
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });

      // Also set input values for display
      setBookingInputValues((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        orderQuantitiesMap.current.forEach((orderQuantities, channelId) => {
          if (!updated[channelId] || Object.keys(updated[channelId]).length === 0) {
            const inputValues: Record<string, string> = {};
            Object.entries(orderQuantities).forEach(([month, qty]) => {
              inputValues[month] = qty.toString();
            });
            updated[channelId] = inputValues;
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    }
  }, [useSavedPrograms, campaignProgramsData, setBookingQuantities, setBookingInputValues]);

  // Filter out excluded programs separately to ensure reactivity
  const filteredAvailabilityPrograms = useMemo(() => {
    const excludedSet = new Set(excludedPrograms);
    return availabilityPrograms.filter(
      (program) => !excludedSet.has(program.channel_id)
    );
  }, [availabilityPrograms, excludedPrograms]);

  const reportMonths = useMemo(() => {
    const monthSet = new Set<string>();
    filteredAvailabilityPrograms.forEach((program) => {
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
  }, [filteredAvailabilityPrograms]);

  const insertPrintTypes: InsertPrintType[] = useMemo(() => {
    const raw =
      (printTypesData as any)?.data ??
      (printTypesData as any)?.types ??
      printTypesData ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [printTypesData]);

  // Auto-select first insert format on first visit
  useEffect(() => {
    if (insertPrintTypes.length > 0 && !selectedInsertType) {
      const firstType = insertPrintTypes[0];
      const firstTypeValue =
        firstType.id ??
        firstType.code ??
        firstType.name ??
        firstType.label;
      if (firstTypeValue) {
        setSelectedInsertType(String(firstTypeValue));
      }
    }
  }, [insertPrintTypes, selectedInsertType, setSelectedInsertType]);

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

  const handleDeleteProgram = (programId: string, programName: string) => {
    // Set program to delete to show confirmation modal
    setProgramToDelete({ id: programId, name: programName });
  };

  const confirmDeleteProgram = () => {
    if (!programToDelete) return;

    const channelId = programToDelete.id;

    // Find the program to get its program_id
    const programToRemove = availabilityPrograms.find((p) => p.channel_id === channelId);
    const programId = programToRemove?.program_id;

    // Set flags to prevent useEffects from interfering
    isDeletingRef.current = true;
    skipRefetchRef.current = true;

    // Remove from selected programs (channel_ids) so checkbox is unchecked when going back
    setSelectedPrograms((prev) => prev.filter((id) => id !== channelId));

    // Remove from selected program IDs if we have the program_id
    if (programId) {
      setSelectedProgramIds((prev) => prev.filter((id) => id !== programId));
    } else {
      // If program_id not available, try to remove by channel_id (in case they're the same)
      setSelectedProgramIds((prev) => prev.filter((id) => id !== channelId));
    }

    // Add to excluded programs - this will immediately filter the program out
    setExcludedPrograms((prev) => {
      if (prev.includes(channelId)) {
        return prev; // Already excluded
      }
      return [...prev, channelId];
    });

    // Clean up cached data for this program
    // Use channelId as fallback if programId is not available
    const idToUse = programId || channelId;

    setBookingQuantities((prev) => {
      const updated = { ...prev };
      if (idToUse) {
        delete updated[idToUse];
      }
      return updated;
    });

    setBookingInputValues((prev) => {
      const updated = { ...prev };
      if (idToUse) {
        delete updated[idToUse];
      }
      return updated;
    });

    setQuantityErrors((prev) => {
      const updated = { ...prev };
      if (idToUse) {
        delete updated[idToUse];
      }
      return updated;
    });

    setBookingTouched((prev) => {
      const updated = { ...prev };
      if (idToUse) {
        delete updated[idToUse];
      }
      return updated;
    });

    // Close modal after state updates
    setProgramToDelete(null);
  };

  const getProgramTotalQuantity = (program: AvailabilityProgram): number => {
    const bookings = bookingQuantities[program.channel_id] || {};
    return reportMonths.reduce((sum, month) => {
      const qty = bookings[month];
      return sum + (qty ?? 0);
    }, 0);
  };

  const getTotalQuantityAcrossAllPrograms = (): number => {
    return filteredAvailabilityPrograms.reduce((total, program) => {
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
    return filteredAvailabilityPrograms.reduce((total, program) => {
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

  const exportToExcel = () => {
    if (filteredAvailabilityPrograms.length === 0) return;

    // Prepare headers
    const headers = [
      "Instant vs Manual",
      "Program Name",
      "Media Rate",
      "Print Rate",
      "Freight",
      "Total Program Amount",
    ];

    // Add month columns
    reportMonths.forEach((month) => {
      headers.push(`${formatMonthLabel(month)} Availability`);
      headers.push(`${formatMonthLabel(month)} Booking Qty`);
    });

    // Prepare data rows
    const rows = filteredAvailabilityPrograms.map((program) => {
      const bookings = bookingQuantities[program.channel_id] || {};
      const row: any[] = [
        program.availability_check_type === "instant" ? "Instant" : "Manual",
        program.program_name,
        getMediaRateForProgram(program),
        getPrintRateForProgram(program),
        getFreightForProgram(program),
        calculateTotalProgramAmount(program),
      ];

      // Add month data
      reportMonths.forEach((month) => {
        const availability = program.monthlyAvailability[month] ?? 0;
        const bookingQty = bookings[month] ?? 0;
        row.push(availability);
        row.push(bookingQty);
      });

      return row;
    });

    // Add total row
    const totalRow: any[] = [
      "",
      "Total Campaign Amount",
      "",
      "",
      "",
      calculateTotalCampaignAmount(),
    ];
    // Add empty cells for month columns
    reportMonths.forEach(() => {
      totalRow.push("");
      totalRow.push("");
    });
    rows.push(totalRow);

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    const columnWidths = [
      { wch: 18 }, // Instant vs Manual
      { wch: 30 }, // Program Name
      { wch: 15 }, // Media Rate
      { wch: 15 }, // Print Rate
      { wch: 15 }, // Freight
      { wch: 20 }, // Total Program Amount
    ];
    reportMonths.forEach(() => {
      columnWidths.push({ wch: 20 }); // Availability
      columnWidths.push({ wch: 18 }); // Booking Qty
    });
    worksheet["!cols"] = columnWidths;

    // Format currency columns
    const currencyColumns = [2, 3, 4, 5]; // Media Rate, Print Rate, Freight, Total Program Amount
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let row = 1; row <= range.e.r; row++) {
      currencyColumns.forEach((col) => {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell && typeof cell.v === "number") {
          cell.z = "$#,##0.00";
        }
      });
    }

    // Format total row
    const totalRowIndex = rows.length;
    const totalCellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: 5 });
    const totalCell = worksheet[totalCellAddress];
    if (totalCell && typeof totalCell.v === "number") {
      totalCell.z = "$#,##0.00";
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Availability Report");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `availability-report-${timestamp}.xlsx`;

    // Export file
    XLSX.writeFile(workbook, filename);
  };

  // Build payload for saving campaign programs
  const buildSaveProgramsPayload = () => {
    if (!campaignId || !effectiveCategoryId || !selectedInsertType) {
      return null;
    }

    const programsPayload: Record<string, any> = {};

    filteredAvailabilityPrograms.forEach((program) => {
      const channelId = program.channel_id;
      const programQuantities = bookingQuantities[channelId] || {};
      const programInputValues = bookingInputValues[channelId] || {};

      // Build availability array
      const availability: Array<{
        available: number;
        order_qty: number;
        month: string;
      }> = [];

      reportMonths.forEach((month) => {
        const available = program.monthlyAvailability[month] || 0;
        const orderQty = programQuantities[month] || programInputValues[month] || 0;
        const numericOrderQty = typeof orderQty === "string" ? parseFloat(orderQty) || 0 : orderQty;

        availability.push({
          available,
          order_qty: numericOrderQty,
          month: month.charAt(0).toUpperCase() + month.slice(1),
        });
      });

      // Build freight object - use original keys from raw data if available
      const freight: Record<string, number> = {};
      const rawProgramData = rawProgramDataMap.current.get(channelId);
      const rawMetrics = rawProgramData?.metrics || {};

      // Extract freight keys from raw metrics
      Object.entries(rawMetrics).forEach(([key, value]) => {
        if (key.startsWith("freight_") && typeof value === "number") {
          freight[key] = value;
        }
      });

      // Fallback: if no freight in raw data, use ranges
      if (Object.keys(freight).length === 0) {
        program.freightRanges.forEach((range) => {
          // Format with k suffix for thousands
          const formatK = (val: number) => {
            if (val >= 1000) return `${val / 1000}k`;
            return String(val);
          };
          const minStr = formatK(range.min);
          const maxStr = range.max ? formatK(range.max) : "";
          const key = `freight_${minStr}${maxStr ? `_${maxStr}` : ""}`;
          freight[key] = range.value;
        });
      }

      // Get selected freight based on total quantity
      const totalQuantity = Object.values(programQuantities).reduce<number>(
        (sum, qty) => {
          const numQty = typeof qty === "number" ? qty : parseFloat(String(qty)) || 0;
          return sum + numQty;
        },
        0
      );
      const selectedFreight = getFreightForQuantity(program, totalQuantity);

      // Get print rate
      const totalQuantityAcrossAllPrograms = getTotalQuantityAcrossAllPrograms();
      const printRate = getPrintPricePerUnit(printMatrix, totalQuantityAcrossAllPrograms);

      programsPayload[channelId] = {
        availability,
        exclusive: program.exclusive || false,
        instant_availability_check: program.availability_check_type,
        reviewed_by_agency: program.reviewed_by_agency || false,
        metrics: {
          freight: {
            ...freight,
            selected_freight: selectedFreight,
          },
          media_rate: program.media_rate,
          print_rate: printRate,
        },
        program_name: program.program_name,
        ...(program.duration_disclaimer && { duration_disclaimer: true }),
      };
    });

    return {
      campaign_id: campaignId,
      category_id: effectiveCategoryId,
      insert_format_id: selectedInsertType,
      programs: programsPayload,
    };
  };

  // Save programs
  const handleSavePrograms = (onSuccess?: () => void) => {
    const payload = buildSaveProgramsPayload();
    if (!payload) {
      toast.error("Missing required data to save programs");
      return;
    }

    callSavePrograms(saveCampaignProgramsApi(payload), () => {
      toast.success("Your programs have been saved successfully");
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    });
  };

  // Expose save function via ref
  useImperativeHandle(ref, () => ({
    savePrograms: async () => {
      return new Promise<void>((resolve, reject) => {
        const payload = buildSaveProgramsPayload();
        if (!payload) {
          reject(new Error("Missing required data to save programs"));
          return;
        }

        callSavePrograms(saveCampaignProgramsApi(payload), () => {
          resolve();
        });
      });
    },
  }));

  // Handle save button click (for the Save Programs button)
  const handleSaveProgramsClick = () => {
    handleSavePrograms();
  };

  // Handle proceed to booking - save programs first, then verify, then proceed
  const handleProceedToBookingClick = () => {
    if (!onProceedToBooking || !campaignId) {
      if (!campaignId) {
        toast.error("Campaign ID is missing");
      }
      return;
    }

    // Reset RESET button visibility
    setShowResetButton(false);

    // Save programs first, then verify campaign
    handleSavePrograms(() => {
      // Call verification API after saving
      callVerifyCampaign(
        verifyCampaignApi(campaignId),
        (response: any) => {
          // Success (200 OK) - proceed to booking
          setShowResetButton(false); // Hide RESET button on success
          if (response?.data?.message) {
            toast.success(response.data.message);
          }
          onProceedToBooking();
        },
        (errorData: any) => {
          // Error handling
          const errorResponse = errorData?.response?.data || errorData?.data || errorData;
          const errorMessage = errorResponse?.message || "Verification failed";

          // Check if error response contains days_difference
          const hasDaysDifference = errorResponse?.days_difference !== undefined;

          // Show error in modal
          setVerificationError({
            message: errorMessage,
            hasDaysDifference,
          });

          // Show RESET button if days_difference exists (regardless of value)
          setShowResetButton(hasDaysDifference);
        }
      );
    });
  };

  // Handle complete (for create campaign flow - non-edit mode)
  const handleCompleteClick = () => {
    if (!onComplete || !campaignId) {
      if (!campaignId) {
        toast.error("Campaign ID is missing");
      }
      return;
    }

    // Reset RESET button visibility
    setShowResetButton(false);

    // Save programs first, then verify campaign
    handleSavePrograms(() => {
      // Call verification API after saving
      callVerifyCampaign(
        verifyCampaignApi(campaignId),
        (response: any) => {
          // Success (200 OK) - proceed to booking
          setShowResetButton(false); // Hide RESET button on success
          if (response?.data?.message) {
            toast.success(response.data.message);
          }
          onComplete();
        },
        (errorData: any) => {
          // Error handling
          const errorResponse = errorData?.response?.data || errorData?.data || errorData;
          const errorMessage = errorResponse?.message || "Verification failed";

          // Check if error response contains days_difference
          const hasDaysDifference = errorResponse?.days_difference !== undefined;

          // Show error in modal
          setVerificationError({
            message: errorMessage,
            hasDaysDifference,
          });

          // Show RESET button if days_difference exists (regardless of value)
          setShowResetButton(hasDaysDifference);
        }
      );
    });
  };

  // Check if manual availability request button should be shown
  const shouldShowManualAvailabilityButton = useMemo(() => {
    const manualPrograms = filteredAvailabilityPrograms.filter(
      (p) => p.availability_check_type === "manual"
    );

    if (manualPrograms.length === 0) {
      console.log("Manual availability button: No manual programs found");
      return false;
    }

    // Check if at least one manual program has reviewed_by_agency = false
    const hasUnreviewedManual = manualPrograms.some((p) => p.reviewed_by_agency === false);

    console.log("Manual availability button check:", {
      manualProgramsCount: manualPrograms.length,
      manualPrograms: manualPrograms.map(p => ({
        name: p.program_name,
        reviewed_by_agency: p.reviewed_by_agency,
        availability_check_type: p.availability_check_type
      })),
      shouldShow: hasUnreviewedManual
    });

    return hasUnreviewedManual;
  }, [filteredAvailabilityPrograms]);

  // Request manual availability check
  const handleRequestManualAvailability = () => {
    if (!campaignId) {
      toast.error("Campaign ID is missing");
      return;
    }

    // First save programs
    const payload = buildSaveProgramsPayload();
    if (!payload) {
      toast.error("Missing required data to save programs");
      return;
    }

    callSavePrograms(saveCampaignProgramsApi(payload), () => {
      // Then request manual availability
      callRequestManualAvailability(
        createManualAvailabilityRequestApi({ campaign_id: campaignId }),
        () => {
          toast.success("Manual availability check request submitted successfully");
          // Redirect to home page after successful API response
          handleBackToHome();
        }
      );
    });
  };

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
      {(loadingAvailability || loadingCampaignPrograms) ? (
        <div className="flex items-center justify-center rounded-xl border bg-white p-8">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-600">Loading availability data...</p>
          </div>
        </div>
      ) : filteredAvailabilityPrograms.length === 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          No availability data available. Please go back and select programs.
        </div>
      ) : !selectedInsertType ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Please select an insert format to view the availability report.
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step 2
              </div>
              <h4 className="text-base font-semibold text-gray-900">
                Availability Report Table
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveProgramsClick}
                disabled={filteredAvailabilityPrograms.length === 0 || savingPrograms || !campaignId || !effectiveCategoryId || !selectedInsertType}
                className="flex items-center gap-2"
              >
                {savingPrograms ? (
                  <>
                    <LoadingSpinner size="sm" className="h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Programs
                  </>
                )}
              </Button>
              {shouldShowManualAvailabilityButton && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleRequestManualAvailability}
                  disabled={requestingManualAvailability || savingPrograms || !campaignId}
                  className="bg-blue-gradient text-white hover:bg-blue-gradient/90 flex items-center gap-2"
                >
                  {requestingManualAvailability || savingPrograms ? (
                    <>
                      <LoadingSpinner size="sm" className="h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      Request Manual Availability Check
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={filteredAvailabilityPrograms.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </div>
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
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAvailabilityPrograms.map((program) => {
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
                      <td className="px-4 py-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteProgram(program.channel_id, program.program_name);
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete program"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
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
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {isEditMode ? (
          <>
            {onResetCampaign && showResetButton && (
              <Button
                variant="outline"
                onClick={onResetCampaign}
                disabled={resettingCampaign}
                className="flex items-center gap-2"
              >
                {resettingCampaign ? (
                  <>
                    <LoadingSpinner size="sm" className="h-4 w-4" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    Reset Campaign
                  </>
                )}
              </Button>
            )}
            {onProceedToBooking && (
              <Button
                variant="default"
                onClick={handleProceedToBookingClick}
                disabled={savingPrograms || verifyingCampaign || hasErrors || !selectedInsertType}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {savingPrograms || verifyingCampaign ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2 h-4 w-4" />
                    {savingPrograms ? "Saving..." : "Verifying..."}
                  </>
                ) : (
                  "Proceed to Booking"
                )}
              </Button>
            )}

          </>
        ) : (
          <Button
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            onClick={handleCompleteClick}
            disabled={savingPrograms || verifyingCampaign || hasErrors || !selectedInsertType}
          >
            {savingPrograms || verifyingCampaign ? (
              <>
                <LoadingSpinner size="sm" className="mr-2 h-4 w-4" />
                {savingPrograms ? "Saving..." : "Verifying..."}
              </>
            ) : (
              "Proceed to Booking"
            )}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!programToDelete} onOpenChange={(open) => !open && setProgramToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {programToDelete?.name}
              </span>
              ? This will remove the program from the availability report and clear all booking
              quantities for this program.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProgramToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteProgram}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Error Modal */}
      <Dialog open={!!verificationError} onOpenChange={(open) => !open && setVerificationError(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle>Verification Failed</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {verificationError?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => setVerificationError(null)}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AvailabilityReportStep.displayName = "AvailabilityReportStep";

