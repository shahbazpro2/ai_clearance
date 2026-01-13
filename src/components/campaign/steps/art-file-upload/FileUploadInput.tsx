import { Upload, FileText, X } from "lucide-react";
import { MonthFileState } from "./types";

interface FileUploadInputProps {
  id: string;
  accept: string;
  fileType: "art" | "csv";
  state: MonthFileState;
  isUploading: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
}

export function FileUploadInput({
  id,
  accept,
  fileType,
  state,
  isUploading,
  onChange,
  onRemove,
}: FileUploadInputProps) {
  const file = fileType === "art" ? state.artFile : state.csvFile;
  const Icon = fileType === "art" ? Upload : FileText;
  const label = fileType === "art" ? "Art File" : "CSV File";

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      <input
        type="file"
        id={id}
        accept={accept}
        onChange={onChange}
        className="hidden"
        disabled={isUploading}
      />
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={id}
          className={`flex items-center gap-1.5 px-2 py-1.5 border rounded cursor-pointer transition-colors text-xs flex-1 ${
            file
              ? "border-blue-400 bg-blue-50 text-blue-700"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {file
              ? file.name.length > 15
                ? `${file.name.substring(0, 15)}...`
                : file.name
              : "Select"}
          </span>
        </label>
        {file && onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="flex-shrink-0 p-1 bg-white hover:bg-red-100 active:bg-red-200 rounded transition-all group border border-red-300 hover:border-red-500 shadow-sm hover:shadow"
            title="Remove selected file"
            type="button"
            aria-label="Remove selected file"
          >
            <X className="h-3.5 w-3.5 text-red-600 group-hover:text-red-800 flex-shrink-0 stroke-2" />
          </button>
        )}
      </div>
      {file && (
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
    </div>
  );
}
