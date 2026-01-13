import { Calendar } from "lucide-react";
import { Month } from "./types";

interface TableHeaderProps {
  months: Month[];
}

export function TableHeader({ months }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 min-w-[200px] border-r">
          Program
        </th>
        {months.map((month) => (
          <th
            key={month.month_number}
            className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-l min-w-[180px]"
          >
            <div className="flex flex-col items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{month.month_name}</span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
