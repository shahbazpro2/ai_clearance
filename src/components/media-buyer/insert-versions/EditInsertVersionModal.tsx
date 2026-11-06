"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import {
  updateInsertVersionApi,
  type InsertVersion,
} from "@/api/mediaBuyer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Info, Lock } from "lucide-react";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/lib/apiError";

interface EditInsertVersionModalProps {
  version: InsertVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedVersion: InsertVersion) => void;
}

export function EditInsertVersionModal({
  version,
  open,
  onOpenChange,
  onSuccess,
}: EditInsertVersionModalProps) {
  const [versionName, setVersionName] = useState<string>("");
  const [inkjetEnabled, setInkjetEnabled] = useState<boolean>(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [callUpdateVersion, { loading: isSubmitting }] = useApi({
    both: false,
    errMsg: false,
  });

  useEffect(() => {
    if (open && version) {
      setVersionName(version.version_name || "");
      setInkjetEnabled(Boolean(version.inkjet_enabled));
      setFieldError(null);
    }
  }, [open, version]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version) return;

    const trimmedName = versionName.trim();
    if (!trimmedName) {
      setFieldError("Version Name is required.");
      return;
    }
    if (trimmedName.length > 100) {
      setFieldError("Version Name must be 100 characters or fewer.");
      return;
    }

    setFieldError(null);

    callUpdateVersion(
      updateInsertVersionApi(version.id, {
        version_name: trimmedName,
        inkjet_enabled: inkjetEnabled,
      }),
      (res: any) => {
        const updated: InsertVersion = res?.data ?? {
          ...version,
          version_name: trimmedName,
          inkjet_enabled: inkjetEnabled,
        };
        toast.success(res?.message || "Insert version updated successfully.");
        onOpenChange(false);
        onSuccess(updated);
      },
      (errorData: any) => {
        const errorMsg = extractErrorMessage(
          errorData,
          "Failed to update insert version."
        );
        toast.error(errorMsg);
        setFieldError(errorMsg);
      }
    );
  };

  const hasChanges =
    version &&
    (versionName.trim() !== version.version_name ||
      inkjetEnabled !== version.inkjet_enabled);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white p-0 flex flex-col h-full shadow-2xl z-50 border-l border-gray-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/70">
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-lg font-bold text-gray-900 leading-tight">
              Edit Insert Version
            </SheetTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Update name and configuration for this insert version.
            </p>
          </SheetHeader>
        </div>

        {/* Drawer Form Body */}
        <form
          id="edit-insert-version-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Format (Read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Insert Format
              </Label>
              <span className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            </div>
            <Input
              value={version?.format?.name || "Insert Format"}
              disabled
              className="bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200"
            />
          </div>

          {/* Version Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="edit-version-name"
                className="text-xs font-semibold uppercase tracking-wider text-gray-700"
              >
                Version Name <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-gray-400">
                {versionName.length}/100
              </span>
            </div>
            <Input
              id="edit-version-name"
              value={versionName}
              onChange={(e) => {
                setVersionName(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              maxLength={100}
              placeholder="e.g. Single Sheet Version A"
              disabled={isSubmitting}
              className="border-gray-300 focus-visible:ring-primary focus-visible:border-primary"
            />
            {fieldError && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldError}
              </p>
            )}
          </div>

          {/* Inkjet Toggle Card */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="edit-inkjet"
                  className="text-sm font-semibold text-gray-900 cursor-pointer"
                >
                  Inkjet Enabled
                </Label>
                <p className="text-xs text-gray-500">
                  Print unique single-use codes on every insert.
                </p>
              </div>
              <Switch
                id="edit-inkjet"
                checked={inkjetEnabled}
                onCheckedChange={setInkjetEnabled}
                disabled={isSubmitting}
              />
            </div>

            {/* Inkjet Disclaimer */}
            {inkjetEnabled && (
              <div className="flex items-start gap-2 pt-2 border-t border-gray-200/80 text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  An additional cost of 1¢ - 10¢ per insert will apply. This is
                  the printing of unique single use codes on every insert, also
                  known as inkjetting. This option requires a CSV file of codes
                  that includes 10% extra for spoilage.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-insert-version-form"
            disabled={isSubmitting || !versionName.trim() || !hasChanges}
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[110px] h-9 text-xs font-semibold disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
