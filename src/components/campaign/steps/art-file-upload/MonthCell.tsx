import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Upload } from "lucide-react";
import { Month, MonthFileState } from "./types";
import { UploadedStatus } from "./UploadedStatus";
import { FileUploadInput } from "./FileUploadInput";

interface MonthCellProps {
  programId: string;
  month: Month;
  state: MonthFileState;
  requiresCsv: boolean;
  isUploading: boolean;
  onFileSelect: (fileType: "art" | "csv", event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileType: "art" | "csv") => void;
  onUpload: () => void;
}

export function MonthCell({
  programId,
  month,
  state,
  requiresCsv,
  isUploading,
  onFileSelect,
  onRemoveFile,
  onUpload,
}: MonthCellProps) {
  const artFileId = `art-${programId}-${month.month_number}`;
  const csvFileId = `csv-${programId}-${month.month_number}`;
  const isUploaded = state.artUploaded || month.art_file_uploaded;

  return (
    <td
      className={`px-3 py-4 border-l ${state.artUploaded ? "bg-green-50/50" : ""}`}
    >
      <div className="flex flex-col gap-2">
        {isUploaded ? (
          <UploadedStatus state={state} requiresCsv={requiresCsv} />
        ) : (
          <>
            <FileUploadInput
              id={artFileId}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
              fileType="art"
              state={state}
              isUploading={isUploading}
              onChange={(e) => onFileSelect("art", e)}
              onRemove={() => onRemoveFile("art")}
            />

            {requiresCsv && (
              <FileUploadInput
                id={csvFileId}
                accept=".csv"
                fileType="csv"
                state={state}
                isUploading={isUploading}
                onChange={(e) => onFileSelect("csv", e)}
                onRemove={state.csvUploaded ? undefined : () => onRemoveFile("csv")}
              />
            )}

            <Button
              onClick={onUpload}
              disabled={!state.artFile || isUploading}
              size="sm"
              className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90 text-xs py-1.5 h-auto"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner className="mr-1" size="sm" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-3 w-3" />
                  Upload
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </td>
  );
}
