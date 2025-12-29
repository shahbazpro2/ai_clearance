"use client";

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
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
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface UnsavedChangesDialogProps {
    hasUnsavedChanges: boolean;
    onSave?: () => Promise<void>;
    enabled?: boolean;
}

export interface UnsavedChangesDialogRef {
    handleNavigationAttempt: (targetPath: string, e?: React.MouseEvent) => boolean;
}

export const UnsavedChangesDialog = forwardRef<UnsavedChangesDialogRef, UnsavedChangesDialogProps>(
    ({ hasUnsavedChanges, onSave, enabled = true }, ref) => {
        const [isSaving, setIsSaving] = useState(false);
        const {
            showDialog,
            handleSaveAndClose: handleSaveAndCloseInternal,
            handleCloseWithoutSaving,
            setShowDialog,
            handleNavigationAttempt,
        } = useUnsavedChanges({
            hasUnsavedChanges,
            onSave: async () => {
                if (onSave) {
                    setIsSaving(true);
                    try {
                        await onSave();
                    } finally {
                        setIsSaving(false);
                    }
                }
            },
            enabled,
        });

        // Expose navigation handler to parent via ref
        useImperativeHandle(ref, () => ({
            handleNavigationAttempt,
        }));

        const handleSaveAndClose = async () => {
            await handleSaveAndCloseInternal();
        };

        return (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <DialogTitle>Unsaved Changes</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">
                            Do you want to save changes or close without saving?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={handleCloseWithoutSaving}
                            disabled={isSaving}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleSaveAndClose}
                            disabled={isSaving}
                            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                        >
                            {isSaving ? "Saving..." : "Save & Close"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
);

UnsavedChangesDialog.displayName = "UnsavedChangesDialog";

