import { atom } from "jotai";

export interface RetailerSetupContext {
  accountId: string;
  accountName: string;
  audienceId: string;
  audienceName: string;
  currentStep: number;
  /** Cache of form data keyed by step identifier (e.g. "1", "2") for pre-filling when going back */
  stepData?: Record<string, any>;
}

export const retailerSetupContextAtom = atom<RetailerSetupContext | null>(null);
