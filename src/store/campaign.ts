import { atom } from "jotai";

export const campaignIdAtom = atom<string | null>(null);

export interface ClassificationResult {
  predicted_category: string;
  predicted_category_id?: string | null;
  predicted_category_label?: string | null;
  category_matched: boolean;
  [key: string]: any;
}

export const classificationResultAtom = atom<ClassificationResult | null>(null);
export const selectedCategoryAtom = atom<string | null>(null);
export const selectedCategoryLabelAtom = atom<string | null>(null);
export const selfSelectedCategoryAtom = atom<string | null>(null);
export const selfSelectedCategoryLabelAtom = atom<string | null>(null);
export const selectedProgramsAtom = atom<string[]>([]);
export const selectedProgramIdsAtom = atom<string[]>([]);
export const selectedProgramCategoryAtom = atom<string | null>(null);

// Cache for availability report state
export type BookingQuantityCache = Record<string, Record<string, number | null>>;
export type BookingInputValuesCache = Record<string, Record<string, string>>;
export type QuantityErrorsCache = Record<string, Record<string, string | undefined>>;
export type BookingTouchedCache = Record<string, Record<string, boolean | undefined>>;

export const availabilityReportBookingQuantitiesAtom = atom<BookingQuantityCache>({});
export const availabilityReportInputValuesAtom = atom<BookingInputValuesCache>({});
export const availabilityReportQuantityErrorsAtom = atom<QuantityErrorsCache>({});
export const availabilityReportBookingTouchedAtom = atom<BookingTouchedCache>({});
export const availabilityReportSelectedInsertTypeAtom = atom<string>("");
export const availabilityReportExcludedProgramsAtom = atom<string[]>([]);
// Flag to track if cache was cleared - prevents restoring programs after cache clear
export const cacheClearedAtom = atom<boolean>(false);
