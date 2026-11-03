"use client";

import { useApi } from "use-hook-api";
import { deleteBrandSubmissionApi, type BrandSubmission } from "@/api/mediaBuyer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

interface DeleteBrandDialogProps {
  brand: BrandSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (brandSubmissionId: string) => void;
}

export function DeleteBrandDialog({
  brand,
  open,
  onOpenChange,
  onSuccess,
}: DeleteBrandDialogProps) {
  const [callDeleteBrand, { loading: isDeleting }] = useApi({
    both: false,
    errMsg: false,
  });

  const handleDelete = () => {
    if (!brand) return;

    callDeleteBrand(
      deleteBrandSubmissionApi(brand.brand_submission_id),
      (response: any) => {
        toast.success(
          response?.message || "Brand submission removed successfully."
        );
        onOpenChange(false);
        onSuccess(brand.brand_submission_id);
      },
      (errorData: any) => {
        const errorMsg = extractErrorMessage(
          errorData,
          "Failed to remove brand submission."
        );
        toast.error(errorMsg);
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
            Remove Brand Submission
          </DialogTitle>
          <p className="text-xs text-gray-500">
            Remove this brand from your submitted brands list.
          </p>
        </DialogHeader>

        <div className="py-2 text-sm text-gray-600">
          Are you sure you want to remove the brand submission for{" "}
          <span className="font-semibold text-gray-900">
            {brand?.domain}
          </span>
          ?
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Removing...
              </>
            ) : (
              "Remove Brand"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
