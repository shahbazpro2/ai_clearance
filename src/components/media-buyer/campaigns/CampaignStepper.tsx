"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignStepperProps {
  currentStep: number; // 1, 2, 3, or 4
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { step: 1, label: "Brand Selection" },
  { step: 2, label: "Program Selection" },
  { step: 3, label: "Campaign Configurator" },
  { step: 4, label: "Review & Submit" },
];

export function CampaignStepper({ currentStep, onStepClick }: CampaignStepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative px-2">
        {/* Connecting Progress Line */}
        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-gray-200 -translate-y-1/2 z-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((Math.min(currentStep, 4) - 1) / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {STEPS.map((s) => {
          const isCompleted = currentStep > s.step;
          const isActive = currentStep === s.step;
          const isPending = currentStep < s.step;
          const canClick = onStepClick && isCompleted;

          return (
            <div
              key={s.step}
              onClick={() => canClick && onStepClick(s.step)}
              className={cn(
                "relative z-10 flex flex-col items-center select-none",
                canClick ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 shadow-xs",
                  isCompleted &&
                    "bg-emerald-600 text-white hover:bg-emerald-700",
                  isActive &&
                    "bg-primary text-white ring-4 ring-primary/20",
                  isPending &&
                    "bg-white border-2 border-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                ) : (
                  <span>{s.step}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center whitespace-nowrap",
                  isActive && "font-bold text-primary",
                  isCompleted && "font-semibold text-gray-800",
                  isPending && "font-medium text-gray-400"
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
