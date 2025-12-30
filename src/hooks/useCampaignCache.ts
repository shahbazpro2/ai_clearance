import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import {
  campaignIdAtom,
  classificationResultAtom,
  selectedCategoryAtom,
  selectedCategoryLabelAtom,
  selfSelectedCategoryAtom,
  selfSelectedCategoryLabelAtom,
  selectedProgramsAtom,
  selectedProgramIdsAtom,
  selectedProgramCategoryAtom,
  availabilityReportBookingQuantitiesAtom,
  availabilityReportInputValuesAtom,
  availabilityReportQuantityErrorsAtom,
  availabilityReportBookingTouchedAtom,
  availabilityReportSelectedInsertTypeAtom,
  availabilityReportExcludedProgramsAtom,
  cacheClearedAtom,
} from "@/store/campaign";

/**
 * Custom hook to manage campaign cache clearing and navigation
 * Provides functions to clear all campaign-related state and navigate to home
 */
export function useCampaignCache() {
  const router = useRouter();

  // Get all setters for campaign-related atoms
  const setCampaignId = useSetAtom(campaignIdAtom);
  const setClassificationResult = useSetAtom(classificationResultAtom);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const setSelectedCategoryLabel = useSetAtom(selectedCategoryLabelAtom);
  const setSelfSelectedCategory = useSetAtom(selfSelectedCategoryAtom);
  const setSelfSelectedCategoryLabel = useSetAtom(
    selfSelectedCategoryLabelAtom
  );
  const setSelectedPrograms = useSetAtom(selectedProgramsAtom);
  const setSelectedProgramIds = useSetAtom(selectedProgramIdsAtom);
  const setSelectedProgramCategory = useSetAtom(selectedProgramCategoryAtom);
  const setBookingQuantities = useSetAtom(
    availabilityReportBookingQuantitiesAtom
  );
  const setBookingInputValues = useSetAtom(availabilityReportInputValuesAtom);
  const setQuantityErrors = useSetAtom(availabilityReportQuantityErrorsAtom);
  const setBookingTouched = useSetAtom(availabilityReportBookingTouchedAtom);
  const setSelectedInsertType = useSetAtom(
    availabilityReportSelectedInsertTypeAtom
  );
  const setExcludedPrograms = useSetAtom(
    availabilityReportExcludedProgramsAtom
  );
  const setCacheCleared = useSetAtom(cacheClearedAtom);

  /**
   * Clears all campaign-related cache and state
   * This includes:
   * - All campaign-related atoms
   * - Availability report state
   * - Program selection state
   * - localStorage and sessionStorage cache entries
   */
  const clearAllCampaignCache = useCallback(() => {
    console.log("Clearing all campaign cache...");

    // Clear all atoms - do this synchronously and multiple times to ensure it sticks
    setCampaignId(null);
    setClassificationResult(null);
    setSelectedCategory(null);
    setSelectedCategoryLabel(null);
    setSelfSelectedCategory(null);
    setSelfSelectedCategoryLabel(null);
    // Clear program selection atoms - ensure both are cleared
    setSelectedPrograms([]);
    setSelectedProgramIds([]);
    setSelectedProgramCategory(null);
    // Clear availability report atoms
    setBookingQuantities({});
    setBookingInputValues({});
    setQuantityErrors({});
    setBookingTouched({});
    setSelectedInsertType("");
    setExcludedPrograms([]);
    // Set flag to indicate cache was cleared
    setCacheCleared(true);

    // Force clear program atoms again after a microtask to ensure they're cleared
    setTimeout(() => {
      setSelectedPrograms([]);
      setSelectedProgramIds([]);
      setSelectedProgramCategory(null);
    }, 0);

    // Clear API cache from localStorage and sessionStorage
    try {
      if (typeof window !== "undefined") {
        // Clear localStorage
        const localStorageKeysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.includes("campaignDetails") ||
              key.includes("campaigns") ||
              key.includes("campaign") ||
              key.toLowerCase().includes("program"))
          ) {
            localStorageKeysToRemove.push(key);
          }
        }
        localStorageKeysToRemove.forEach((key) => {
          localStorage.removeItem(key);
          console.log("Removed localStorage key:", key);
        });

        // Clear sessionStorage
        const sessionStorageKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (
            key &&
            (key.includes("campaignDetails") ||
              key.includes("campaigns") ||
              key.includes("campaign") ||
              key.toLowerCase().includes("program"))
          ) {
            sessionStorageKeysToRemove.push(key);
          }
        }
        sessionStorageKeysToRemove.forEach((key) => {
          sessionStorage.removeItem(key);
          console.log("Removed sessionStorage key:", key);
        });

        // Try to clear useApi internal cache if accessible
        // useApi might store cache in a global object or context
        try {
          // Clear any global cache objects that might exist
          if ((window as any).__useApiCache) {
            delete (window as any).__useApiCache;
          }
          if ((window as any).useApiCache) {
            delete (window as any).useApiCache;
          }
        } catch (e) {
          // Ignore errors for global cache clearing
        }

        console.log("Cache clearing complete. Removed:", {
          localStorage: localStorageKeysToRemove.length,
          sessionStorage: sessionStorageKeysToRemove.length,
        });
      }
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  }, [
    setCampaignId,
    setClassificationResult,
    setSelectedCategory,
    setSelectedCategoryLabel,
    setSelfSelectedCategory,
    setSelfSelectedCategoryLabel,
    setSelectedPrograms,
    setSelectedProgramIds,
    setSelectedProgramCategory,
    setBookingQuantities,
    setBookingInputValues,
    setQuantityErrors,
    setBookingTouched,
    setSelectedInsertType,
    setExcludedPrograms,
    setCacheCleared,
  ]);

  /**
   * Clears all campaign cache and navigates to home page
   * Use this when user clicks "Back to Home" button
   */
  const handleBackToHome = useCallback(() => {
    // Clear all cache first - ensure it's synchronous
    clearAllCampaignCache();

    // Force clear program atoms one more time to ensure they're empty
    setSelectedPrograms([]);
    setSelectedProgramIds([]);
    setSelectedProgramCategory(null);

    // Use a small delay to ensure atoms are cleared before navigation
    // This prevents race conditions where navigation happens before state updates
    setTimeout(() => {
      // Clear one final time before navigation
      setSelectedPrograms([]);
      setSelectedProgramIds([]);
      router.push("/");
    }, 50);
  }, [
    clearAllCampaignCache,
    router,
    setSelectedPrograms,
    setSelectedProgramIds,
    setSelectedProgramCategory,
  ]);

  return {
    clearAllCampaignCache,
    handleBackToHome,
  };
}
