import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onSave?: () => Promise<void>;
  enabled?: boolean;
}

interface UseUnsavedChangesReturn {
  showDialog: boolean;
  pendingNavigation: string | null;
  handleNavigationAttempt: (targetPath: string, e?: React.MouseEvent) => boolean;
  handleSaveAndClose: () => Promise<void>;
  handleCloseWithoutSaving: () => void;
  setShowDialog: (show: boolean) => void;
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  onSave,
  enabled = true,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const router = useRouter();
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  // Warn user before leaving if there are unsaved changes (tab closing)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "Do you want to save changes or close without saving?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, enabled]);

  // Intercept browser back button using history API
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    // Push a state to enable back button interception
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // Show dialog when back button is pressed
      setPendingNavigation("/");
      setShowDialog(true);
      // Push state back to prevent navigation
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, enabled]);

  // Intercept navigation attempts
  const handleNavigationAttempt = useCallback(
    (targetPath: string, e?: React.MouseEvent) => {
      if (!enabled || !hasUnsavedChanges) {
        return true; // Allow navigation
      }

      e?.preventDefault();
      e?.stopPropagation();
      setPendingNavigation(targetPath);
      setShowDialog(true);
      return false; // Prevent navigation
    },
    [hasUnsavedChanges, enabled]
  );

  // Handle save and close
  const handleSaveAndClose = useCallback(async () => {
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      if (onSave) {
        await onSave();
      }
      setShowDialog(false);
      if (pendingNavigation) {
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      // Error handling is done by the onSave function
      // Don't navigate if save failed
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, pendingNavigation, router]);

  // Handle close without saving
  const handleCloseWithoutSaving = useCallback(() => {
    setShowDialog(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router]);

  return {
    showDialog,
    pendingNavigation,
    handleNavigationAttempt,
    handleSaveAndClose,
    handleCloseWithoutSaving,
    setShowDialog,
  };
}

