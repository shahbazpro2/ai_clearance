"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import {
  editPendingBrandSubmissionApi,
  type BrandSubmission,
} from "@/api/mediaBuyer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Info, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

function extractErrorMessage(errorData: any, fallback: string): string {
  const detail =
    errorData?.fullRes?.detail ??
    errorData?.response?.data?.detail ??
    errorData?.detail ??
    errorData?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const firstMsg = detail[0]?.msg || detail[0]?.message;
    if (typeof firstMsg === "string") return firstMsg;
  }

  const message =
    errorData?.fullRes?.message ??
    errorData?.response?.data?.message ??
    errorData?.data?.message ??
    errorData?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (Array.isArray(message) && message.length > 0) {
    return message.filter(Boolean).join(", ");
  }

  return fallback;
}

interface EditBrandModalProps {
  brand: BrandSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedBrand: BrandSubmission) => void;
}

export function EditBrandModal({
  brand,
  open,
  onOpenChange,
  onSuccess,
}: EditBrandModalProps) {
  const [website, setWebsite] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [callUpdateBrand, { loading: isUpdating }] = useApi({
    both: false,
    errMsg: false,
  });

  useEffect(() => {
    if (brand && open) {
      setWebsite(brand.domain || "");
      setFieldError(null);
    }
  }, [brand, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;

    const trimmedWebsite = website.trim();
    if (!trimmedWebsite) {
      setFieldError("Website / Domain is required.");
      return;
    }

    setFieldError(null);

    callUpdateBrand(
      editPendingBrandSubmissionApi(brand.brand_submission_id, {
        website: trimmedWebsite,
      }),
      (response: any) => {
        const updatedData: BrandSubmission = response?.data || {
          ...brand,
          domain: trimmedWebsite,
        };
        toast.success(
          response?.message || "Brand submission updated successfully."
        );
        onOpenChange(false);
        onSuccess(updatedData);
      },
      (errorData: any) => {
        const errorMsg = extractErrorMessage(
          errorData,
          "Failed to update brand submission."
        );
        toast.error(errorMsg);
        setFieldError(errorMsg);
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Edit Pending Brand
          </DialogTitle>
          <p className="text-xs text-gray-500">
            Update the website or domain for this pending brand submission.
          </p>
        </DialogHeader>

        {/* Note Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-xs">
          <Info className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
          <p>
            Enter the top-level website/domain rather than a specific page URL, preferably in the format{" "}
            <code className="font-mono font-medium text-gray-800">www.domain.com</code>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="edit-brand-domain" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Website / Domain <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-brand-domain"
              value={website}
              onChange={(e) => {
                setWebsite(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="e.g. www.example.com"
              disabled={isUpdating}
              className="font-mono text-sm border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            />
            {fieldError && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isUpdating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isUpdating || !website.trim() || website.trim() === brand?.domain}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[110px]"
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
