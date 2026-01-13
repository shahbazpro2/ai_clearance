import { Badge } from "@/components/ui/badge";
import { Calendar, Package, CheckCircle2, Upload, FileText } from "lucide-react";
import { ArtFilesDetails, FileUploadState } from "./types";

interface StatisticsProps {
  artFilesDetails: ArtFilesDetails;
  fileUploadState: FileUploadState;
}

export function Statistics({ artFilesDetails, fileUploadState }: StatisticsProps) {
  const totalMonths = artFilesDetails.programs.reduce(
    (sum, program) => sum + program.months.length,
    0
  );
  
  const uploadedMonths = artFilesDetails.programs.reduce(
    (sum, program) =>
      sum + program.months.filter((month) => month.art_file_uploaded).length,
    0
  );

  const totalPrograms = artFilesDetails.programs.length;
  
  const programsWithAllUploaded = artFilesDetails.programs.filter((program) =>
    program.months.every((month) => {
      const state = fileUploadState[program.id]?.[month.month_number];
      return state?.artUploaded || month.art_file_uploaded;
    })
  ).length;

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Art Files</h2>
          <p className="text-gray-600">
            Upload art files and code files for each ordered month of your selected programs.
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Total Programs</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalPrograms}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Programs Complete</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{programsWithAllUploaded}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Total Months</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalMonths}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Uploaded</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {uploadedMonths}/{totalMonths}
          </p>
        </div>
      </div>

      {artFilesDetails.get_csv_files && (
        <div className="mt-4">
          <Badge variant="secondary" className="text-sm">
            <FileText className="h-3 w-3 mr-1" />
            CSV files required
          </Badge>
        </div>
      )}
    </div>
  );
}
