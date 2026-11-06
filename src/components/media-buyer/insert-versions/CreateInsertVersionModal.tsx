"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import {
  createInsertVersionApi,
  type InsertFormat,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Info } from "lucide-react";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/lib/apiError";

interface CreateInsertVersionModalProps {
  formats: InsertFormat[];
  initialFormat: InsertFormat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newVersion: InsertVersion) => void;
}

export function CreateInsertVersionModal({
  formats,
  initialFormat,
  open,
  onOpenChange,
  onSuccess,
}: CreateInsertVersionModalProps) {
  const [formatId, setFormatId] = useState<string>("");
  const [versionName, setVersionName] = useState<string>("");
  const [inkjetEnabled, setInkjetEnabled] = useState<boolean>(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [callCreateVersion, { loading: isSubmitting }] = useApi({
    both: false,
    errMsg: false,
  });

  useEffect(() => {
    if (open) {
      if (initialFormat) {
        setFormatId(initialFormat.id);
      } else if (formats.length > 0) {
        setFormatId(formats[0].id);
      }
      setVersionName("");
      setInkjetEnabled(false);
      setFieldError(null);
    }
  }, [open, initialFormat, formats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = versionName.trim();
    if (!trimmedName) {
      setFieldError("Version Name is required.");
      return;
    }
    if (trimmedName.length > 100) {
      setFieldError("Version Name must be 100 characters or fewer.");
      return;
    }
    if (!formatId) {
      setFieldError("Please select an insert format.");
      return;
    }

    setFieldError(null);

    callCreateVersion(
      createInsertVersionApi({
        insert_format_id: formatId,
        version_name: trimmedName,
        inkjet_enabled: inkjetEnabled,
      }),
      (res: any) => {
        const created: InsertVersion = res?.data ?? res;
        toast.success(res?.message || "Insert version created successfully.");
        onOpenChange(false);
        onSuccess(created);
      },
      (errorData: any) => {
        const errorMsg = extractErrorMessage(
          errorData,
          "Failed to create insert version."
        );
        toast.error(errorMsg);
        setFieldError(errorMsg);
      }
    );
  };

  const selectedFormatObj = formats.find((f) => f.id === formatId);

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
              Create Insert Version
            </SheetTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Set up your insert version details.
            </p>
          </SheetHeader>
        </div>

        {/* Drawer Form Body */}
        <form
          id="create-insert-version-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Format Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="create-format"
              className="text-xs font-semibold uppercase tracking-wider text-gray-700"
            >
              Insert Format <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formatId}
              onValueChange={(val) => {
                setFormatId(val);
                if (fieldError) setFieldError(null);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="create-format" className="bg-white">
                <SelectValue placeholder="Select insert format" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} ({f.price_range})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFormatObj && (
              <p className="text-[11px] text-gray-500">
                {selectedFormatObj.size_and_paper
                  ? `Size & Paper: ${selectedFormatObj.size_and_paper}`
                  : `Carrier: ${selectedFormatObj.carrier || "-"} | Card: ${selectedFormatObj.card || "-"}`}
              </p>
            )}
          </div>

          {/* Version Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="create-version-name"
                className="text-xs font-semibold uppercase tracking-wider text-gray-700"
              >
                Version Name <span className="text-red-500">*</span>
              </Label>
              <span className="text-[11px] text-gray-400">
                {versionName.length}/100
              </span>
            </div>
            <Input
              id="create-version-name"
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
                  htmlFor="create-inkjet"
                  className="text-sm font-semibold text-gray-900 cursor-pointer"
                >
                  Inkjet Enabled
                </Label>
                <p className="text-xs text-gray-500">
                  Print unique single-use codes on every insert.
                </p>
              </div>
              <Switch
                id="create-inkjet"
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

          {/* Artwork Notice */}
          <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 text-xs text-blue-900 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Artwork files can be uploaded once your insert version has been
              created.
            </p>
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
            form="create-insert-version-form"
            disabled={isSubmitting || !versionName.trim() || !formatId}
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[110px] h-9 text-xs font-semibold disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              "Save Version"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
