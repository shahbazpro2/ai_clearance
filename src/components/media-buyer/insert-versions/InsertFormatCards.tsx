"use client";

import { useState } from "react";
import type { InsertFormat } from "@/api/mediaBuyer";
import { Button } from "@/components/ui/button";
import { SamplePreviewModal } from "@/components/media-buyer/insert-versions/SamplePreviewModal";
import { FileText, Tag, CreditCard, Play, Download, Plus } from "lucide-react";
import { toast } from "react-toastify";

interface InsertFormatCardsProps {
  formats: InsertFormat[];
  loading: boolean;
  onCreateVersion: (format: InsertFormat) => void;
}

export function InsertFormatCards({
  formats,
  loading,
  onCreateVersion,
}: InsertFormatCardsProps) {
  const [previewFormat, setPreviewFormat] = useState<InsertFormat | null>(null);

  const getFormatIcon = (slug: string) => {
    if (slug.includes("hang-tag")) {
      return <Tag className="h-5 w-5" />;
    }
    if (slug.includes("card")) {
      return <CreditCard className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const handleDownloadTemplate = (format: InsertFormat) => {
    if (format.design_template_reference) {
      window.open(format.design_template_reference, "_blank", "noopener,noreferrer");
    } else {
      toast.info(
        `Design template for ${format.name} is currently being prepared and will be available soon.`
      );
    }
  };

  const handleViewSample = (format: InsertFormat) => {
    setPreviewFormat(format);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs mb-8">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Insert Formats</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Select an insert format to create a customized version for your campaigns.
        </p>
      </div>

      {loading && formats.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-xl border border-gray-200 bg-gray-50/70 animate-pulse p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-12 w-full bg-gray-200 rounded mt-4" />
              </div>
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {formats.map((format) => (
            <div
              key={format.id}
              className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-blue-300 hover:shadow-sm"
            >
              {/* Card Header & Spec Details */}
              <div>
                {/* Icon */}
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                  {getFormatIcon(format.slug)}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-gray-900 leading-tight">
                  {format.name}
                </h3>

                {/* Price Range Badge */}
                <div className="mt-2 mb-3.5">
                  <span className="inline-block rounded-md bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200/80">
                    {format.price_range}
                  </span>
                </div>

                {/* Specification Content */}
                <div className="min-h-[58px] text-xs text-gray-600 leading-relaxed space-y-1 py-1">
                  {format.size_and_paper && (
                    <div>
                      <strong className="text-gray-900 font-semibold">Size & Paper: </strong>
                      <span>{format.size_and_paper}</span>
                    </div>
                  )}
                  {format.carrier && (
                    <div>
                      <strong className="text-gray-900 font-semibold">Carrier: </strong>
                      <span>{format.carrier}</span>
                    </div>
                  )}
                  {format.card && (
                    <div>
                      <strong className="text-gray-900 font-semibold">Card: </strong>
                      <span>{format.card}</span>
                    </div>
                  )}
                </div>

                {/* Interactive Action Links */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => handleViewSample(format)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
                    View Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate(format)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Design Template
                  </button>
                </div>
              </div>

              {/* Create Version CTA */}
              <div className="mt-5 pt-2">
                <Button
                  onClick={() => onCreateVersion(format)}
                  className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm text-xs font-semibold h-9 rounded-lg"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Version
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sample Preview Modal */}
      <SamplePreviewModal
        format={previewFormat}
        open={!!previewFormat}
        onOpenChange={(open) => !open && setPreviewFormat(null)}
      />
    </div>
  );
}
