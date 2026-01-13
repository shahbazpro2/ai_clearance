import { CheckCircle2, FileText } from "lucide-react";
import { MonthFileState } from "./types";

interface UploadedStatusProps {
  state: MonthFileState;
  requiresCsv: boolean;
}

export function UploadedStatus({ state, requiresCsv }: UploadedStatusProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-green-100 rounded border border-green-300">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
        <span className="text-xs text-green-700 font-medium">Art File Uploaded</span>
      </div>
      {requiresCsv && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-green-100 rounded border border-green-300">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
          <span className="text-xs text-green-700 font-medium">
            {state.csvUploaded ? "CSV Uploaded" : "CSV Optional"}
          </span>
        </div>
      )}
    </div>
  );
}
