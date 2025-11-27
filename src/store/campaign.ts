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
export const selectedProgramsAtom = atom<string[]>([]);
export const selectedProgramIdsAtom = atom<string[]>([]);
export const selectedProgramCategoryAtom = atom<string | null>(null);

