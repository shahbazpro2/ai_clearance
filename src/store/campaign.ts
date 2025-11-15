import { atom } from "jotai";

export const campaignIdAtom = atom<string | null>(null);

export interface ClassificationResult {
  predicted_category: string;
  category_matched: boolean;
  [key: string]: any;
}

export const classificationResultAtom = atom<ClassificationResult | null>(null);
export const selectedCategoryAtom = atom<string | null>(null);

