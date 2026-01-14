"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface BlockedProgram {
  program_name: string;
  reason: string;
}

interface BlockedProgramsModalProps {
  blockedPrograms: Record<string, BlockedProgram> | null;
  onClose: () => void;
}

export function BlockedProgramsModal({
  blockedPrograms,
  onClose,
}: BlockedProgramsModalProps) {
  if (!blockedPrograms || Object.keys(blockedPrograms).length === 0) {
    return null;
  }

  const blockedProgramsList = Object.entries(blockedPrograms);

  return (
    <Dialog open={!!blockedPrograms} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <DialogTitle>Blocked Programs</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            The following {blockedProgramsList.length} program{blockedProgramsList.length !== 1 ? "s are" : " is"} blocked and cannot be used in this campaign:
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <div className="space-y-3 pt-4">
            {blockedProgramsList.map(([programId, program]) => (
              <div
                key={programId}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      {program.program_name}
                    </p>
                    <p className="text-sm text-gray-700">
                      {program.reason}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Program ID: {programId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="default"
            onClick={onClose}
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
