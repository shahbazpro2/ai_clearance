"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

export function SampleViewerDialog({
  open,
  url,
  onClose,
}: {
  open: boolean;
  url: string | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-none !w-screen max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>View Sample</DialogTitle>
          <DialogDescription>Preview of the file in the current window.</DialogDescription>
        </DialogHeader>
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              >
                <Minus className="h-4 w-4 mr-1" /> Zoom Out
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
              >
                <Plus className="h-4 w-4 mr-1" /> Zoom In
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(1)}
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
            <div className="text-sm text-gray-600">{Math.round(zoom * 100)}%</div>
          </div>
          <div
            ref={containerRef}
            className={`w-full overflow-auto ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
            style={{ height: "90vh" }}
            onMouseDown={(e) => {
              if (zoom <= 1) return;
              const container = containerRef.current;
              if (!container) return;
              setIsDragging(true);
              dragStateRef.current = {
                x: e.clientX,
                y: e.clientY,
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop,
              };
            }}
            onMouseMove={(e) => {
              if (!isDragging || zoom <= 1) return;
              const container = containerRef.current;
              const dragState = dragStateRef.current;
              if (!container || !dragState) return;
              e.preventDefault();
              const dx = e.clientX - dragState.x;
              const dy = e.clientY - dragState.y;
              container.scrollLeft = dragState.scrollLeft - dx;
              container.scrollTop = dragState.scrollTop - dy;
            }}
            onMouseUp={() => {
              setIsDragging(false);
              dragStateRef.current = null;
            }}
            onMouseLeave={() => {
              setIsDragging(false);
              dragStateRef.current = null;
            }}
            onTouchStart={(e) => {
              if (zoom <= 1) return;
              const touch = e.touches[0];
              const container = containerRef.current;
              if (!container || !touch) return;
              setIsDragging(true);
              dragStateRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                scrollLeft: container.scrollLeft,
                scrollTop: container.scrollTop,
              };
            }}
            onTouchMove={(e) => {
              if (!isDragging || zoom <= 1) return;
              const touch = e.touches[0];
              const container = containerRef.current;
              const dragState = dragStateRef.current;
              if (!container || !dragState || !touch) return;
              const dx = touch.clientX - dragState.x;
              const dy = touch.clientY - dragState.y;
              container.scrollLeft = dragState.scrollLeft - dx;
              container.scrollTop = dragState.scrollTop - dy;
            }}
            onTouchEnd={() => {
              setIsDragging(false);
              dragStateRef.current = null;
            }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${100 / zoom}%`,
              }}
            >
              <iframe
                src={url || ""}
                className="w-full max-h-[calc(90vh-40px)] h-[calc(90vh-40px)] rounded-md border"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
