"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { InsertFormat } from "@/api/mediaBuyer";
import { PlayCircle, FileText, Tag, CreditCard } from "lucide-react";

interface SamplePreviewModalProps {
  format: InsertFormat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SamplePreviewModal({
  format,
  open,
  onOpenChange,
}: SamplePreviewModalProps) {
  if (!format) return null;

  const isVideo =
    format.sample_video_reference &&
    (format.sample_video_reference.endsWith(".mp4") ||
      format.sample_video_reference.endsWith(".webm") ||
      format.sample_video_reference.includes("youtube") ||
      format.sample_video_reference.includes("vimeo"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {format.name} — Sample Preview
          </DialogTitle>
          <p className="text-xs text-gray-500">
            Review specifications and sample details for this insert format.
          </p>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {isVideo ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <video
                src={format.sample_video_reference!}
                controls
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                {format.slug.includes("hang-tag") ? (
                  <Tag className="h-7 w-7" />
                ) : format.slug.includes("card") ? (
                  <CreditCard className="h-7 w-7" />
                ) : (
                  <FileText className="h-7 w-7" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{format.name}</h3>
                <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {format.price_range}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1 bg-white p-3 rounded-lg border border-gray-200 text-left max-w-sm mx-auto">
                {format.size_and_paper && (
                  <div>
                    <span className="font-semibold text-gray-700">Size & Paper: </span>
                    {format.size_and_paper}
                  </div>
                )}
                {format.carrier && (
                  <div>
                    <span className="font-semibold text-gray-700">Carrier: </span>
                    {format.carrier}
                  </div>
                )}
                {format.card && (
                  <div>
                    <span className="font-semibold text-gray-700">Card: </span>
                    {format.card}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                Live video sample preview is being finalized and will be updated soon.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
