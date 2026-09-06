"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useMemo } from "react";

export function SampleViewerDialog({
  open,
  url,
  onClose,
  mimeType,
}: {
  open: boolean;
  url: string | null;
  onClose: () => void;
  mimeType?: string | null;
}) {
  const isImage = useMemo(() => {
    if (mimeType?.startsWith("image/")) return true;
    if (!url) return false;
    const normalizedUrl = url.split("?")[0].toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((extension) =>
      normalizedUrl.endsWith(extension),
    );
  }, [url, mimeType]);

  const isPdf = useMemo(() => {
    if (mimeType === "application/pdf") return true;
    if (!url) return false;
    return url.split("?")[0].toLowerCase().endsWith(".pdf");
  }, [url, mimeType]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="!max-w-none !w-screen !h-[95vh]">
        <DialogHeader>
          <DialogTitle>View Sample</DialogTitle>
          <DialogDescription>Preview of the file in the current window.</DialogDescription>
        </DialogHeader>
        <div className="w-full">
          {isImage ? (
            <TransformWrapper
              initialScale={1}
              wheel={{ step: 0.2 }}
              doubleClick={{ disabled: true }}
              pinch={{ step: 0.5 }}
              centerOnInit
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => zoomOut()}>
                        <Minus className="h-4 w-4 mr-1" /> Zoom Out
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => zoomIn()}>
                        <Plus className="h-4 w-4 mr-1" /> Zoom In
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resetTransform()}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reset
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">Zoom</div>
                  </div>
                  <TransformComponent
                    wrapperStyle={{ width: "100%", height: "calc(95vh - 140px)" }}
                    wrapperClass="rounded-md border bg-neutral-50"
                    contentClass="select-none"
                  >
                    <img src={url || ""} alt="Preview" className="object-contain h-[80vh]" />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          ) : isPdf ? (
            <div className="w-full flex flex-col gap-2">
              <a href={url || "#"} target="_blank" rel="noreferrer" className="text-sm text-primary underline self-end">
                Open in new tab
              </a>
              <iframe
                src={`${url}#toolbar=1`}
                title="PDF preview"
                className="w-full rounded-md border bg-white flex-1 min-h-[calc(95vh-180px)]"
              />
            </div>
          ) : (
            <div className="w-full h-[calc(95vh-140px)] rounded-md border flex items-center justify-center">
              <div className="text-center text-sm text-gray-600">
                Preview not supported.{" "}
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">
                    Open in new tab
                  </a>
                ) : (
                  "No file URL."
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
