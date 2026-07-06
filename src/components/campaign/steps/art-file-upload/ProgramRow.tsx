import { Program, Month, MonthFileState, FileUploadState } from "./types";
import { ProgramInfo } from "./ProgramInfo";
import { MonthCell } from "./MonthCell";

interface ProgramRowProps {
  program: Program;
  months: Month[];
  fileUploadState: FileUploadState;
  requiresCsv: boolean;
  uploadingFiles: Set<string>;
  onFileSelect: (programId: string, monthNumber: number, fileType: "art" | "csv", event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (programId: string, monthNumber: number, fileType: "art" | "csv") => void;
  onUpload: (programId: string, monthNumber: number) => void;
}

export function ProgramRow({
  program,
  months,
  fileUploadState,
  requiresCsv,
  uploadingFiles,
  onFileSelect,
  onRemoveFile,
  onUpload,
}: ProgramRowProps) {
  const programUploadedMonths = program.months.filter((month) => {
    const state = fileUploadState[program.id]?.[month.month_number];
    return state?.artUploaded || month.art_file_uploaded;
  }).length;
  
  const programTotalMonths = program.months.length;
  const isProgramComplete = programUploadedMonths === programTotalMonths;

  const getMonthState = (month: { month_number: number; art_file_uploaded: boolean; csv_file_uploaded?: boolean }): MonthFileState => {
    return fileUploadState[program.id]?.[month.month_number] || {
      artFile: null,
      csvFile: null,
      artUploaded: month.art_file_uploaded,
      csvUploaded: month.csv_file_uploaded || false,
    };
  };

  const programMonthsByNumber = new Map<number, Month>(
    (program.months ?? []).map((m) => [m.month_number, m])
  );

  return (
    <tr
      className={`hover:bg-gray-50 ${isProgramComplete ? "bg-green-50/30" : ""}`}
    >
      <td className={`px-4 py-4 whitespace-nowrap sticky left-0 z-10 border-r ${
        isProgramComplete ? "bg-green-50/30" : "bg-white"
      }`}>
        <ProgramInfo
          program={program}
          uploadedMonths={programUploadedMonths}
          totalMonths={programTotalMonths}
          isComplete={isProgramComplete}
        />
      </td>

      {months.map((month) => {
        const programMonth = programMonthsByNumber.get(month.month_number);
        if (!programMonth) {
          return (
            <td
              key={month.month_number}
              className="px-3 py-4 border-l bg-gray-50/30"
            />
          );
        }

        const state = getMonthState(programMonth);
        const uploadKey = `${program.id}-${programMonth.month_number}`;
        const isUploading = uploadingFiles.has(uploadKey);

        return (
          <MonthCell
            key={programMonth.month_number}
            programId={program.id}
            month={programMonth}
            state={state}
            requiresCsv={requiresCsv}
            isUploading={isUploading}
            onFileSelect={(fileType, e) =>
              onFileSelect(program.id, programMonth.month_number, fileType, e)
            }
            onRemoveFile={(fileType) =>
              onRemoveFile(program.id, programMonth.month_number, fileType)
            }
            onUpload={() => onUpload(program.id, programMonth.month_number)}
          />
        );
      })}
    </tr>
  );
}
