"use client";

import { Button } from "@/components/ui/button";

interface ProgramsSelectionStepProps {
  selectedCategoryType: "ai" | "self" | null;
  onComplete: () => void;
}

export function ProgramsSelectionStep({ selectedCategoryType, onComplete }: ProgramsSelectionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Programs Selection</h3>
        <p className="text-sm text-gray-600 mb-4">
          Retailer endpoint is not ready yet. This step will be implemented once the endpoint is available.
        </p>
        {selectedCategoryType && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Selected category: {selectedCategoryType === "ai" ? "AI-Predicted" : "Self-Declared"}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onComplete}
          className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
        >
          Complete
        </Button>
      </div>
    </div>
  );
}

