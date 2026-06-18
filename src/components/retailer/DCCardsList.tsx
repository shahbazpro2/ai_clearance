"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus } from "lucide-react";
import { DistributionCenterCard } from "./DistributionCenterCard";
import { AllocationSummary } from "./AllocationSummary";

interface DistributionCenter {
  allocation_percentage: number;
  shipping_address_1: string;
  distribution_center_name: string;
  localStatus?: "active" | "inactive";
}

interface DistributionCenterWithStatus {
  allocation_percentage: number;
  distribution_center_name: string;
  shipping_address_1: string;
  distribution_center_salesforce_id: string | null;
  localStatus?: "active" | "inactive";
}

interface DCCardsListProps {
  distributionCenters: DistributionCenter[];
  dcIds: string[];
  selectedDCId: string | null;
  totalAllocation: number;
  isAllocationValid: boolean;
  loadingDCs: boolean;
  onSelectDC: (id: string) => void;
  onRemoveDC: (id: string) => void;
  onAddNew: () => void;
  canAddNew?: boolean;
}

export function DCCardsList({
  distributionCenters,
  dcIds,
  selectedDCId,
  totalAllocation,
  isAllocationValid,
  loadingDCs,
  onSelectDC,
  onRemoveDC,
  canAddNew = true,
  onAddNew,
}: DCCardsListProps) {
  const allocationError =
    totalAllocation !== 100 ? `Total must equal 100% (current: ${totalAllocation}%)` : null;

  return (
    <div className="lg:col-span-1 flex flex-col gap-3">
      <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2">
        {loadingDCs ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <>
            {distributionCenters.map((dc, idx) => {
              const dcId = dcIds[idx];
              return (
                <DistributionCenterCard
                  key={dcId}
                  name={dc.distribution_center_name}
                  address={dc.shipping_address_1}
                  allocation={dc.allocation_percentage}
                  isSelected={selectedDCId === dcId}
                  onSelect={() => onSelectDC(dcId)}
                  onRemove={() => onRemoveDC(dcId)}
                  status={dc.localStatus || "active"}
                />
              );
            })}
          </>
        )}
      </div>

      {!loadingDCs && (
        <Button
          onClick={onAddNew}
          variant="outline"
          className="w-full"
          disabled={!canAddNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Distribution Center
        </Button>
      )}

      {!loadingDCs && <AllocationSummary totalAllocation={totalAllocation} isValid={isAllocationValid} error={allocationError} />}
    </div>
  );
}
