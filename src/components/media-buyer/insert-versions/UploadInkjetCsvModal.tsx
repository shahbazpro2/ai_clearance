"use client";

import { useState, useRef } from "react";
import { useApi } from "use-hook-api";
import {
  uploadInkjetCsvApi,
  type InsertVersion,
} from "@/api/mediaBuyer";
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
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/lib/apiError";

interface UploadInkjetCsvModalProps {
  version: InsertVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedVersion: InsertVersion) => void;
}

export function UploadInkjetCsvModal({
  version,
  open,
  onOpenChange,
  onSuccess,
}: UploadInkjetCsvModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [callUploadCsv, { loading: isUploading }] = useApi({
    both: false,
    errMsg: false,
  });

  const resetState = () => {
    setSelectedFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (file: File | null) => {
    setErrorMsg(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setErrorMsg("Inkjet codes must be provided as a CSV file.");
      setSelectedFile(null);
      return;
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("CSV file exceeds the maximum allowed size of 5 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !selectedFile || isUploading) return;

    setErrorMsg(null);

    const formData = new FormData();
    formData.append("csv_file", selectedFile);

    callUploadCsv(
      uploadInkjetCsvApi(version.id, formData),
      (res: any) => {
        const data = res?.data ?? res;
        const rowCount = data?.csv_row_count;
        const countText = rowCount != null ? ` (${rowCount} codes)` : "";

        const updated: InsertVersion = {
          ...version,
          inkjet_csv_uploaded: true,
          csv_original_filename: data?.csv_original_filename || selectedFile.name,
          csv_row_count: rowCount,
          csv_uploaded_at: data?.csv_uploaded_at || new Date().toISOString(),
        };

        toast.success(
          res?.message || `Inkjet CSV uploaded successfully${countText}.`
        );
        onOpenChange(false);
        resetState();
        onSuccess(updated);
      },
      (err: any) => {
        const msg = extractErrorMessage(err, "Failed to upload inkjet CSV.");
        toast.error(msg);
        setErrorMsg(msg);
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetState();
        onOpenChange(val);
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => isUploading && e.preventDefault()}
        onEscapeKeyDown={(e) => isUploading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Upload Inkjet CSV Codes
          </DialogTitle>
          <p className="text-xs text-gray-500">
            {version?.version_name ? (
              <>Provide unique single-use codes for <strong className="text-gray-700">{version.version_name}</strong>.</>
            ) : (
              "Provide unique single-use codes for this version."
            )}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Spoilage & Format Notice */}
          <div className="rounded-lg bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-semibold">Requirement Checklist:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
                <li>First row must be the column header (e.g. <code className="font-mono">code</code>).</li>
                <li>Include at least 10% extra codes for printer spoilage.</li>
                <li>Maximum file size: 5 MB (.csv only).</li>
              </ul>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Upload Error</strong>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              selectedFile
                ? "border-blue-500 bg-blue-50/30"
                : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV file containing single-use codes (up to 5 MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isUploading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[140px]"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload CSV File"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
