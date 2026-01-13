import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Building2, Tag } from "lucide-react";
import { Program } from "./types";

interface ProgramInfoProps {
  program: Program;
  uploadedMonths: number;
  totalMonths: number;
  isComplete: boolean;
}

export function ProgramInfo({ program, uploadedMonths, totalMonths, isComplete }: ProgramInfoProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">
          {program.program_name}
        </span>
        {isComplete && (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {program.channel_name && (
          <Badge variant="outline" className="text-xs">
            <Building2 className="h-2.5 w-2.5 mr-1" />
            {program.channel_name}
          </Badge>
        )}
        {program.category_name && (
          <Badge variant="outline" className="text-xs">
            <Tag className="h-2.5 w-2.5 mr-1" />
            {program.category_name}
          </Badge>
        )}
        {program.cover_all && (
          <Badge variant="default" className="text-xs bg-blue-500">
            Cover All
          </Badge>
        )}
        {program.cover_space && (
          <Badge variant="default" className="text-xs bg-purple-500">
            Cover Space
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-500">
          {uploadedMonths}/{totalMonths} uploaded
        </span>
        <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[100px]">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all"
            style={{
              width: `${(uploadedMonths / totalMonths) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
