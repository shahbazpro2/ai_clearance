"use client";

import { useState, useRef } from "react";
import { useApi } from "use-hook-api";
import {
  uploadInsertArtworkApi,
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
  FileCheck2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { extractErrorMessage } from "@/lib/apiError";

interface UploadArtworkModalProps {
  version: InsertVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedVersion: InsertVersion) => void;
}

export function UploadArtworkModal({
  version,
  open,
  onOpenChange,
  onSuccess,
}: UploadArtworkModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationFailedMsg, setValidationFailedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [callUploadArtwork, { loading: isUploading }] = useApi({
    both: false,
    errMsg: false,
  });

  const resetState = () => {
    setSelectedFile(null);
    setValidationFailedMsg(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (file: File | null) => {
    setValidationFailedMsg(null);
    setErrorMsg(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setErrorMsg("Artwork must be a PDF file.");
      setSelectedFile(null);
      return;
    }

    // 25 MB limit
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("File exceeds the maximum allowed size of 25 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !selectedFile || isUploading) return;

    setValidationFailedMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("artwork", selectedFile);

    callUploadArtwork(
      uploadInsertArtworkApi(version.id, formData),
      (res: any) => {
        const returnedData = res?.data ?? res;
        // Check if validation passed
        if (returnedData?.validation_passed === false) {
          setValidationFailedMsg(
            res?.message ||
              "Artwork failed temporary validation and was not uploaded. Please review your PDF file and try again."
          );
          return;
        }

        const updated: InsertVersion = {
          ...version,
          artwork_uploaded: true,
          ...(returnedData?.id ? returnedData : {}),
        };

        toast.success(
          res?.message || "Artwork passed validation and was uploaded successfully."
        );
        onOpenChange(false);
        resetState();
        onSuccess(updated);
      },
      (err: any) => {
        const msg = extractErrorMessage(err, "Failed to upload artwork.");
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
            Upload Artwork
          </DialogTitle>
          <p className="text-xs text-gray-500">
            {version?.version_name ? (
              <>Upload print-ready PDF artwork for <strong className="text-gray-700">{version.version_name}</strong>.</>
            ) : (
              "Upload print-ready PDF artwork for this version."
            )}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Format Spec Reminder */}
          {version?.format && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-800">Format: {version.format.name}</span>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {version.format.size_and_paper
                    ? `Required Size: ${version.format.size_and_paper}`
                    : `Carrier: ${version.format.carrier || "-"} | Card: ${version.format.card || "-"}`}
                </p>
              </div>
            </div>
          )}

          {/* Validation Warning Alert */}
          {validationFailedMsg && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block">Validation Failed</strong>
                <p className="mt-0.5 leading-relaxed">{validationFailedMsg}</p>
              </div>
            </div>
          )}

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
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 break-all">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
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
                    PDF file only (up to 25 MB)
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
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm min-w-[130px]"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload Artwork"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
