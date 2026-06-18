"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface DCCardProps {
  name: string;
  address: string;
  allocation: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  status?: "active" | "inactive";
}

export function DistributionCenterCard({
  name,
  address,
  allocation,
  isSelected,
  onSelect,
  onRemove,
  status = "active",
}: DCCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "bg-primary/10 border-primary"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-sm text-gray-900 truncate">{name || "Untitled"}</p>
        <Badge className={`text-xs whitespace-nowrap flex-shrink-0 ${
          status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }`}>
          {status}
        </Badge>
      </div>
      <p className="text-xs text-gray-500 truncate mb-2">{address}</p>
      <div className="flex items-center justify-between mb-2">
        <Badge className="bg-blue-100 text-blue-700 text-xs">
          {allocation}%
        </Badge>
      </div>
      {isSelected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-3 w-3 mr-1" />
          Remove
        </Button>
      )}
    </div>
  );
}
