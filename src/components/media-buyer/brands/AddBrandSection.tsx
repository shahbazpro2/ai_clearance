"use client";

import { useState, useMemo } from "react";
import { useApi } from "use-hook-api";
import { submitBrandWebsitesApi, type BrandSubmission } from "@/api/mediaBuyer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Info, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

interface AddBrandSectionProps {
  onBrandsAdded: (newBrands: BrandSubmission[]) => void;
}

export function AddBrandSection({ onBrandsAdded }: AddBrandSectionProps) {
  const [inputText, setInputText] = useState("");

  const [callSubmitBrands, { loading: isSubmitting }] = useApi({
    both: false,
    errMsg: false,
  });

  const parsedWebsites = useMemo(() => {
    return inputText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }, [inputText]);

  const websiteCount = parsedWebsites.length;
  const isOverLimit = websiteCount > 100;
  const isValidCount = websiteCount > 0 && !isOverLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCount || isSubmitting) return;

    callSubmitBrands(
      submitBrandWebsitesApi({ websites: parsedWebsites }),
      (response: any) => {
        const returnedData: BrandSubmission[] =
          response?.data ?? response?.data?.data ?? [];
        toast.success(
          response?.message ||
            `${returnedData.length || websiteCount} brand website(s) processed successfully.`
        );
        setInputText("");
        onBrandsAdded(returnedData);
      },
      (errorData: any) => {
        const errorMsg =
          errorData?.fullRes?.detail?.message ||
          (typeof errorData?.fullRes?.detail === "string" ? errorData?.fullRes?.detail : null) ||
          errorData?.detail?.message ||
          (typeof errorData?.detail === "string" ? errorData?.detail : null) ||
          errorData?.detail?.[0]?.msg ||
          (Array.isArray(errorData?.message) ? errorData.message.filter(Boolean).join(", ") : errorData?.message) ||
          errorData?.fullRes?.message ||
          errorData?.data?.message ||
          (errorData?.status === 404
            ? "Media Buyer Brands endpoint not found (404)."
            : "Failed to submit brand websites.");
        toast.error(errorMsg);
      }
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs mb-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Add Brands</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Submit brand websites to verify clearance for campaign creation.
        </p>
      </div>

      {/* Domain Format Notice */}
      <div className="flex items-start gap-2.5 p-3 mb-4 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600">
        <Info className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-gray-900">Note:</strong> Please enter the top-level website/domain rather than a specific page URL, preferably in the format{" "}
          <code className="font-mono font-medium text-gray-800">www.domain.com</code> (e.g. www.example.com). Maximum 100 websites per submission.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="brand-websites" className="font-semibold text-gray-700">
              Brand Websites / Domains
            </label>
            <span
              className={`font-medium ${
                isOverLimit
                  ? "text-red-600 font-bold"
                  : websiteCount > 0
                  ? "text-blue-700"
                  : "text-gray-400"
              }`}
            >
              {websiteCount} / 100 websites
            </span>
          </div>

          <Textarea
            id="brand-websites"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting}
            placeholder="www.brandone.com&#10;www.brandtwo.com&#10;brandthree.com"
            rows={4}
            className={`font-mono text-xs resize-y border-gray-300 focus-visible:ring-primary focus-visible:border-primary ${
              isOverLimit ? "border-red-400 focus-visible:ring-red-400" : ""
            }`}
          />

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-gray-500">
              Enter one website per line or comma-separated.
            </p>
            {isOverLimit && (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Exceeds maximum limit of 100 websites
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={!isValidCount || isSubmitting}
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[130px] text-xs font-semibold"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              `Submit ${websiteCount > 0 ? `(${websiteCount})` : "Websites"}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
