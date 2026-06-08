"use client";

interface AllocationSummaryProps {
  totalAllocation: number;
  isValid: boolean;
  error: string | null;
}

export function AllocationSummary({
  totalAllocation,
  isValid,
  error,
}: AllocationSummaryProps) {
  return (
    <div className="p-3 rounded-lg border bg-gray-50">
      <p className="text-xs font-semibold text-gray-600 mb-2">Total Allocation</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${isValid ? "text-green-600" : "text-red-600"}`}>
          {totalAllocation}%
        </span>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
