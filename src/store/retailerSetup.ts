import { atom } from "jotai";

export interface RetailerSetupContext {
  accountId: string;
  accountName: string;
  audienceId: string;
  audienceName: string;
  currentStep: number;
}

export const retailerSetupContextAtom = atom<RetailerSetupContext | null>(null);
