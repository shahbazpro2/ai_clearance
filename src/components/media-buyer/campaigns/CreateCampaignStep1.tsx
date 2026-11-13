"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useApi } from "use-hook-api";
import {
  fetchEligibleBrandsApi,
  fetchSubmittedBrandsApi,
  createCampaignApi,
  type EligibleBrand,
  type BrandSubmission,
  type CampaignRecord,
} from "@/api/mediaBuyer";
import { CampaignStepper } from "@/components/media-buyer/campaigns/CampaignStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { extractErrorMessage } from "@/lib/apiError";
import { ArrowRight, Info, AlertCircle } from "lucide-react";

interface CreateCampaignStep1Props {
  initialCampaignName?: string;
  initialBrandId?: string;
  onCancel: () => void;
  onSuccess: (campaign: CampaignRecord) => void;
}

export function CreateCampaignStep1({
  initialCampaignName = "",
  initialBrandId = "",
  onCancel,
  onSuccess,
}: CreateCampaignStep1Props) {
  const [campaignName, setCampaignName] = useState(initialCampaignName);
  const [selectedBrandId, setSelectedBrandId] = useState(initialBrandId);

  const [eligibleBrands, setEligibleBrands] = useState<EligibleBrand[]>([]);
  const [submittedBrands, setSubmittedBrands] = useState<BrandSubmission[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // APIs
  const [callGetEligible] = useApi({ both: false, errMsg: false });
  const [callGetSubmitted] = useApi({ both: false, errMsg: false });
  const [callCreateCampaign, { loading: isCreating }] = useApi({
    both: false,
    errMsg: false,
  });

  useEffect(() => {
    let isMounted = true;
    setLoadingBrands(true);

    // Fetch eligible brands (5.1)
    callGetEligible(
      fetchEligibleBrandsApi(),
      (res: any) => {
        if (!isMounted) return;
        const list: EligibleBrand[] = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setEligibleBrands(list);
          if (list.length > 0 && !selectedBrandId) {
            setSelectedBrandId(list[0].brand_id);
          }
        }
      },
      (err: any) => {
        console.warn("Could not load eligible brands:", err);
      }
    );

    // Fetch submitted brands (to show pending brands disabled)
    callGetSubmitted(
      fetchSubmittedBrandsApi(),
      (res: any) => {
        if (!isMounted) return;
        const list: BrandSubmission[] = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setSubmittedBrands(list);
        }
        setLoadingBrands(false);
      },
      () => {
        if (isMounted) setLoadingBrands(false);
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter pending brands from submitted brands (those not yet approved or ready)
  const pendingBrands = submittedBrands.filter((sb) => {
    const isAlreadyEligible = eligibleBrands.some(
      (eb) =>
        eb.brand_id === sb.brand_submission_id ||
        eb.domain.toLowerCase() === sb.domain.toLowerCase()
    );
    return !isAlreadyEligible && sb.status?.toLowerCase() !== "approved";
  });

  const isFormValid =
    campaignName.trim().length > 0 &&
    selectedBrandId.trim().length > 0 &&
    eligibleBrands.some((b) => b.brand_id === selectedBrandId);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid || isCreating) return;

    const trimmedName = campaignName.trim();
    const chosenBrand = eligibleBrands.find((b) => b.brand_id === selectedBrandId);

    callCreateCampaign(
      createCampaignApi({
        brand_id: selectedBrandId,
        name: trimmedName,
      }),
      (res: any) => {
        const returnedData = res?.data ?? res;
        const createdCampaign: CampaignRecord = {
          id: returnedData?.id || `camp_${Date.now()}`,
          name: trimmedName,
          brand_id: selectedBrandId,
          brand_name: chosenBrand?.name || chosenBrand?.domain || "Brand",
          brand_domain: chosenBrand?.domain || "",
          status: returnedData?.status || "Draft",
          created_at: returnedData?.created_at || new Date().toISOString(),
          updated_at: returnedData?.updated_at || new Date().toISOString(),
          selected_programs: returnedData?.selected_programs || [],
          step: 2,
        };

        toast.success(res?.message || "Campaign created successfully.");
        onSuccess(createdCampaign);
      },
      (err: any) => {
        const msg = extractErrorMessage(err, "Failed to create campaign.");
        toast.error(msg);
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* 4-Step Stepper */}
      <CampaignStepper currentStep={1} />

      {/* Step 1 Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 md:p-8">
        <div className="border-b border-gray-100 pb-5 mb-6">
          <span className="text-xs font-bold text-primary tracking-wide uppercase">
            Step 1 of 4
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-1">
            Campaign Details & Brand Selection
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select the brand you want to build a campaign or estimate for.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="campaign-name"
              className="block text-sm font-semibold text-gray-800"
            >
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Q4 National Product Launch 2026"
              required
              maxLength={255}
              className="h-10 text-sm bg-white"
            />
            <p className="text-xs text-gray-400">
              A clear name helps you identify this campaign in reports and dashboard.
            </p>
          </div>

          {/* Brand Selection Dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="brand-select"
              className="block text-sm font-semibold text-gray-800"
            >
              Select Brand <span className="text-red-500">*</span>
            </label>

            {loadingBrands ? (
              <div className="h-10 border border-gray-200 rounded-lg flex items-center px-3 text-xs text-gray-500 gap-2 bg-gray-50">
                <LoadingSpinner size="sm" />
                <span>Loading available brands...</span>
              </div>
            ) : (
              <select
                id="brand-select"
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                required
                className="w-full h-10 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white text-gray-800"
              >
                <option value="" disabled>
                  -- Choose an approved brand --
                </option>

                {/* Approved / Eligible Brands */}
                {eligibleBrands.length > 0 && (
                  <optgroup label="Ready for Campaigns (Approved)">
                    {eligibleBrands.map((b) => (
                      <option key={b.brand_id} value={b.brand_id}>
                        {b.name} ({b.domain})
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Pending Brands (Disabled with Pending badge/text) */}
                {pendingBrands.length > 0 && (
                  <optgroup label="Pending Approval (Grayed Out / Cannot Proceed)">
                    {pendingBrands.map((pb) => (
                      <option
                        key={pb.brand_submission_id}
                        value={pb.brand_submission_id}
                        disabled
                        className="text-gray-400 bg-gray-50"
                      >
                        {pb.domain} — [Pending Approval]
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}

            {/* Helper Note with Link to Brand Setup */}
            <div className="mt-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2.5 text-xs text-primary">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                Brands must be approved before building campaigns. Don&apos;t see your brand?{" "}
                <Link
                  href="/media-buyer/brands"
                  className="font-bold underline text-primary hover:opacity-80"
                >
                  Go to Brand Setup Module to create a new brand
                </Link>
                .
              </div>
            </div>

            {/* No Eligible Brands Warning */}
            {!loadingBrands && eligibleBrands.length === 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  You do not have any approved brands yet. Please submit your brands in{" "}
                  <Link href="/media-buyer/brands" className="font-bold underline">
                    Brand Setup
                  </Link>{" "}
                  and wait for approval before creating campaigns.
                </div>
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-10 px-5 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={!isFormValid || isCreating}
                className="h-10 px-6 bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Saving Draft...</span>
                  </>
                ) : (
                  <>
                    <span>Next: Program Selection</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
