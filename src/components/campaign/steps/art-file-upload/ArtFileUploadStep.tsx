"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useArtFileUpload } from "./useArtFileUpload";
import { Statistics } from "./Statistics";
import { TableHeader } from "./TableHeader";
import { ProgramRow } from "./ProgramRow";
import { Month } from "./types";

interface ArtFileUploadStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function ArtFileUploadStep({ onBack, onNext }: ArtFileUploadStepProps) {
  const {
    artFilesDetails,
    fileUploadState,
    uploadingFiles,
    loadingDetails,
    handleFileSelect,
    handleRemoveFile,
    handleUpload,
    allFilesUploaded,
  } = useArtFileUpload();

  const allMonths: Month[] = useMemo(() => {
    const map = new Map<number, Month>();
    artFilesDetails?.programs?.forEach((program) => {
      program.months?.forEach((month) => {
        if (!map.has(month.month_number)) {
          map.set(month.month_number, month);
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.month_number - b.month_number);
  }, [artFilesDetails]);

  if (loadingDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-gray-600">Loading art file details...</span>
      </div>
    );
  }

  if (!artFilesDetails) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No art file details found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Statistics
        artFilesDetails={artFilesDetails}
        fileUploadState={fileUploadState}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHeader months={allMonths} />
              <tbody className="bg-white divide-y divide-gray-200">
                {artFilesDetails.programs.map((program) => (
                  <ProgramRow
                    key={program.id}
                    program={program}
                    months={allMonths}
                    fileUploadState={fileUploadState}
                    requiresCsv={artFilesDetails.get_csv_files}
                    uploadingFiles={uploadingFiles}
                    onFileSelect={handleFileSelect}
                    onRemoveFile={handleRemoveFile}
                    onUpload={handleUpload}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between border-t pt-4">
        {/* <Button variant="outline" onClick={onBack}>
          Back
        </Button> */}
        <div></div>
        <Button
          onClick={onNext}
          disabled={!allFilesUploaded()}
          className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
