"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InsertVersion } from "@/api/mediaBuyer";
import { FileCheck2, CheckCircle2, Upload } from "lucide-react";

interface ViewArtworkModalProps {
  version: InsertVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReupload?: () => void;
}

export function ViewArtworkModal({
  version,
  open,
  onOpenChange,
  onReupload,
}: ViewArtworkModalProps) {
  if (!version) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Artwork Status — {version.version_name}
          </DialogTitle>
          <p className="text-xs text-gray-500">
            Validated print-ready artwork details.
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Artwork Approved & Uploaded
              </div>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Your PDF artwork has successfully passed validation and is linked to this insert version for campaign printing.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 text-xs text-gray-600 space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Version:</span>
              <span className="font-semibold text-gray-900">{version.version_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Format:</span>
              <span className="font-semibold text-gray-900">{version.format?.name || "Standard Insert"}</span>
            </div>
            {version.format?.size_and_paper && (
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Size & Paper:</span>
                <span className="font-medium text-gray-900">{version.format.size_and_paper}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Validation Status:</span>
              <span className="font-semibold text-emerald-700">Passed</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 px-3 text-xs font-medium text-gray-700 border-gray-300"
          >
            Close
          </Button>
          {onReupload && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onReupload();
              }}
              className="h-8 px-3 text-xs font-medium text-gray-700 hover:text-primary hover:bg-gray-50 border-gray-300 whitespace-nowrap transition-colors"
            >
              <Upload className="h-3.5 w-3.5 mr-1 text-gray-500" />
              Replace Artwork
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
