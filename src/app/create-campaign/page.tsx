"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { DashboardNavbar } from "@/components/common/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UnsavedChangesDialog, type UnsavedChangesDialogRef } from "@/components/ui/unsaved-changes-dialog";
import { ArrowLeft } from "lucide-react";
import {
  CreateCampaignStep,
  CategorySelectionStep,
  UploadAndClassifyStep,
  CategoryMismatchStep,
  ProgramsSelectionStep,
  AvailabilityReportStep,
  ArtFileUploadStep,
  AgreementStep,
  type AvailabilityReportStepRef,
} from "@/components/campaign/steps";
import { ProgressBar } from "@/components/campaign/ProgressBar";
import { useAtomValue, useSetAtom } from "jotai";
import {
  classificationResultAtom,
  campaignIdAtom,
  selectedCategoryAtom,
  selectedCategoryLabelAtom,
  selfSelectedCategoryAtom,
  selfSelectedCategoryLabelAtom,
  selectedProgramIdsAtom,
  availabilityReportBookingQuantitiesAtom,
} from "@/store/campaign";
import { useCampaignCache } from "@/hooks/useCampaignCache";
import { fetchCampaignDetailsApi, resetCampaignProgramsApi, saveCampaignProgramsApi } from "../../../api/campaigns";
import { useApi } from "use-hook-api";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "react-toastify";
import { RotateCcw } from "lucide-react";

const TOTAL_STEPS = 8;

function CreateCampaignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignIdFromQuery = searchParams?.get("campaign_id");
  const stepFromQuery = searchParams?.get("step");
  const isEditMode = !!campaignIdFromQuery;

  const [currentStep, setCurrentStep] = useState(() => {
    if (stepFromQuery) {
      const step = parseInt(stepFromQuery, 10);
      return step >= 1 && step <= TOTAL_STEPS ? step : 1;
    }
    return 1;
  });
  const [selectedCategoryForProceed, setSelectedCategoryForProceed] = useState<"ai" | "self" | null>(null);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [loadingCampaignData, setLoadingCampaignData] = useState(false);
  const justResetRef = useRef(false);
  const classificationResult = useAtomValue(classificationResultAtom);
  const selfSelectedCategory = useAtomValue(selfSelectedCategoryAtom);
  const selfSelectedCategoryLabel = useAtomValue(selfSelectedCategoryLabelAtom);
  const setCampaignId = useSetAtom(campaignIdAtom);
  const setClassificationResult = useSetAtom(classificationResultAtom);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const setSelectedCategoryLabel = useSetAtom(selectedCategoryLabelAtom);
  const setSelfSelectedCategory = useSetAtom(selfSelectedCategoryAtom);
  const setSelfSelectedCategoryLabel = useSetAtom(selfSelectedCategoryLabelAtom);

  // Use custom hook for cache management
  const { clearAllCampaignCache, clearProgramsCache, handleBackToHome } = useCampaignCache();

  // Clear cache when starting a new campaign (not edit mode)
  useEffect(() => {
    if (!isEditMode && !campaignIdFromQuery) {
      // Clear cache when starting fresh campaign creation
      clearAllCampaignCache();
    }
  }, [isEditMode, campaignIdFromQuery, clearAllCampaignCache]);

  const { categories, categoryNames } = useCategories();
  const [callCampaignDetails, { data: campaignDetailsData, loading: loadingDetails }] = useApi({
    errMsg: false,
    cache: 'campaignDetails',
  });
  const [callResetCampaign, { loading: resettingCampaign }] = useApi({ errMsg: true });
  const selectedPrograms = useAtomValue(selectedProgramIdsAtom);
  const bookingQuantities = useAtomValue(availabilityReportBookingQuantitiesAtom);
  const availabilityReportStepRef = useRef<AvailabilityReportStepRef | null>(null);
  const unsavedChangesDialogRef = useRef<UnsavedChangesDialogRef | null>(null);

  // Track unsaved changes based on user interactions
  // Note: We only track changes that haven't been saved yet
  // For step 5: track if programs are selected but not yet submitted
  // For step 6: track if booking quantities have been modified
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    let hasChanges = false;

    if (currentStep === 5) {
      // In step 5, we consider changes if programs are selected
      // This will be cleared when user submits or navigates away after saving
      hasChanges = selectedPrograms.length > 0;
    } else if (currentStep === 6) {
      // In step 6, we consider changes if booking quantities exist
      // This will be cleared when user saves
      hasChanges = Object.keys(bookingQuantities).length > 0;
    }

    setHasUnsavedChanges(hasChanges);
  }, [currentStep, selectedPrograms, bookingQuantities]);

  // Wrap router.push to intercept navigation using dialog's handler
  const safeRouterPush = useCallback((path: string, e?: React.MouseEvent) => {
    if (unsavedChangesDialogRef.current) {
      if (!unsavedChangesDialogRef.current.handleNavigationAttempt(path, e)) {
        return;
      }
    }
    router.push(path);
  }, [router]);

  // Determine correct step based on current_stage and campaign details
  const determineStepFromStage = (campaign: any): number => {
    const currentStage = campaign.current_stage;
    const category = campaign.category || {};

    // 1. If Current Stage = Category Assignment
    if (currentStage === "category_assignment") {
      // Step 1: Check if self_declared_category is None, then redirect to self declare category page
      if (!category.self_declared_category || category.self_declared_category === "None" || category.self_declared_category === null) {
        return 2; // Category Selection Step (self declare category page)
      }

      // Step 2: If self_declared_category is available, check ai_predicted_category
      // If ai_predicted_category is None, then redirect to upload insert for category classification page
      if (!category.ai_predicted_category_id || category.ai_predicted_category_id === "None" || category.ai_predicted_category_id === null) {
        return 3; // Upload and Classify Step
      }

      // Step 3: If ai_predicted_category is available, check confirmed_category_id
      // If confirmed_category_id is not None, then redirect to Programs Selection Page
      // Fetch programs using confirmed_category_id and continue from there
      if (category.confirmed_category_id && category.confirmed_category_id !== "None" && category.confirmed_category_id !== null) {
        return 5; // Programs Selection Step - shows programs by confirmed_category_id
      }

      // Step 4: If confirmed_category_id is None, verify review_status
      const reviewStatus = category.review_status || category.manual_category_review;
      if (!reviewStatus || reviewStatus === "None" || reviewStatus === null || reviewStatus === "") {
        // If review_status is None, redirect user to the page where user can either accept AI predicted category or submit manual review
        return 4; // Category Mismatch Step (accept AI or submit manual review)
      } else {
        // If review_status is not None, redirect user to the page where user can either select AI predicted category or self declared category
        return 4; // Category Mismatch Step (select AI or self declared category to continue for programs selection)
      }
    }

    // 2. If Current Stage = Category Verification or Category Selection
    if (currentStage === "category_verification" || currentStage === "category_selection") {
      // Check if self_declared_category is None, then redirect to category selection page
      if (!category.self_declared_category || category.self_declared_category === "None" || category.self_declared_category === null) {
        return 2; // Category Selection Step
      }

      // If self_declared_category is available, check ai_predicted_category
      if (!category.ai_predicted_category_id || category.ai_predicted_category_id === "None" || category.ai_predicted_category_id === null) {
        return 3; // Upload and Classify Step
      }

      // If ai_predicted_category is available, check confirmed_category_id
      // If confirmed_category_id is not None, redirect to program selection page
      // User will view all programs filtered by confirmed_category_id
      if (category.confirmed_category_id && category.confirmed_category_id !== "None" && category.confirmed_category_id !== null) {
        return 5; // Programs Selection Step - shows programs by confirmed_category_id
      }

      // If confirmed_category_id is None, verify review_status
      const reviewStatus = category.review_status || category.manual_category_review;
      if (!reviewStatus || reviewStatus === "None" || reviewStatus === null) {
        return 4; // Category Mismatch Step (accept AI or submit manual review)
      } else {
        return 4; // Category Mismatch Step (select AI or self declared category)
      }
    }

    // 2. If Current Stage = Program Selection
    if (currentStage === "program_selection" || currentStage === "programs_selection") {
      // Step 1: Check whether confirmed_category_id is None or not None
      // If confirmed_category_id is not None, the user is redirected to the program selection page to view all programs by confirmed_category_id
      if (category.confirmed_category_id && category.confirmed_category_id !== "None" && category.confirmed_category_id !== null) {
        return 5; // Programs Selection Step - shows programs by confirmed_category_id
      }

      // Step 2: If confirmed_category_id is None, check ai_predicted_category
      // If ai_predicted_category is None, then redirect to the upload insert for category classification page
      if (!category.ai_predicted_category_id || category.ai_predicted_category_id === "None" || category.ai_predicted_category_id === null) {
        return 3; // Upload and Classify Step
      }

      // Step 3: If ai_predicted_category is available, verify review_status
      const reviewStatus = category.review_status || category.manual_category_review;
      if (!reviewStatus || reviewStatus === "None" || reviewStatus === null || reviewStatus === "") {
        // If review_status is None, redirect user to the page where user can either Accept AI Predicted Category or Request For Manual Review
        return 4; // Category Mismatch Step (Accept AI or Request Manual Review)
      } else {
        // If review_status is not None (i.e. Pending), redirect user to the page where user can either select AI predicted category or self declared category
        return 4; // Category Mismatch Step (select AI predicted category or self declared category to continue for programs selection)
      }
    }

    // 3. If Current Stage = Availability Planning
    if (currentStage === "availability_planning") {
      // If programs array is empty, show program selection page
      const programs = campaign.programs || [];
      if (!programs || programs.length === 0) {
        return 5; // Programs Selection Step
      }
      return 6; // Availability Report Step
    }

    // 4. If Current Stage = Art Files Submission
    if (currentStage === "artfiles_submission") {
      return 7; // Art File Upload Step
    }

    // 5. If Current Stage = Agreement
    if (currentStage === "agreement") {
      return 8; // Agreement Step
    }

    // Default: use step from query or start from beginning
    if (stepFromQuery) {
      const step = parseInt(stepFromQuery, 10);
      return step >= 1 && step <= TOTAL_STEPS ? step : 1;
    }

    return 1;
  };

  // Process campaign details data (from cache or API response)
  useEffect(() => {
    if (campaignDetailsData?.campaign && campaignIdFromQuery && isEditMode) {
      const campaign = campaignDetailsData.campaign;

      // Verify cached data matches current campaign ID
      if (campaign.id !== campaignIdFromQuery) {
        return; // Cached data is for a different campaign, skip processing
      }

      // If we just reset, handle reset-specific logic
      if (justResetRef.current) {
        justResetRef.current = false;

        const category = campaign.category || {};

        // Use confirmed_category_id or fallback to the category ID that was used previously
        const categoryId = category.confirmed_category_id
          || category.self_declared_category
          || category.ai_predicted_category_id
          || null;

        if (categoryId && categoryId !== "None" && categoryId !== null) {
          // Set category atoms based on confirmed_category_id
          setSelectedCategory(categoryId);
          setSelfSelectedCategory(categoryId);

          // Get category label from categoryNames map
          const label = categoryNames[categoryId] || "";
          if (label) {
            setSelectedCategoryLabel(label);
            setSelfSelectedCategoryLabel(label);
          }

          // Determine selectedCategoryForProceed based on which category was used
          if (category.confirmed_category_id && category.confirmed_category_id !== "None" && category.confirmed_category_id !== null) {
            // Check if it was originally from AI prediction or self-declared
            if (category.predicted_category_accepted && category.ai_predicted_category_id) {
              setSelectedCategoryForProceed("ai");
            } else if (category.self_declared_category) {
              setSelectedCategoryForProceed("self");
            }
          } else if (category.predicted_category_accepted && category.ai_predicted_category_id) {
            setSelectedCategoryForProceed("ai");
          } else if (category.self_declared_category) {
            setSelectedCategoryForProceed("self");
          }
        }

        // Clear only program-related cache (keep categories)
        clearProgramsCache();

        // Redirect to Program Selection page (step 5)
        setCurrentStep(5);
        setHasUnsavedChanges(false);

        // Update URL to reflect step 5
        router.replace(`/create-campaign?campaign_id=${campaignIdFromQuery}&step=5`);
        return;
      }

      // Determine correct step based on stage
      const queryStep = stepFromQuery ? parseInt(stepFromQuery, 10) : null;
      
      const determinedStep = determineStepFromStage(campaign);
      
      // If determined step is 7 (art file upload) or query step is 7, ensure campaign ID is set
      if (determinedStep === 7 || queryStep === 7) {
        setCampaignId(campaignIdFromQuery);
        setCurrentStep(7);
        if (queryStep !== 7) {
          router.replace(`/create-campaign?campaign_id=${campaignIdFromQuery}&step=7`);
        }
        return;
      }

      // Only update step if determined step differs from query step
      if (determinedStep !== queryStep) {
        setCurrentStep(determinedStep);
        // Update URL to reflect the determined step
        router.replace(`/create-campaign?campaign_id=${campaignIdFromQuery}&step=${determinedStep}`);
      } else {
        setCurrentStep(determinedStep);
      }

      // Determine which category to use - prioritize confirmed_category_id
      const categoryId = campaign.category?.confirmed_category_id
        || campaign.category?.self_declared_category
        || campaign.category?.ai_predicted_category_id
        || null;

      // Determine category type for ProgramsSelectionStep
      // If confirmed_category_id exists, use it (no need to set selectedCategoryForProceed as it will use confirmed category)
      if (campaign.category?.confirmed_category_id && campaign.category?.confirmed_category_id !== "None" && campaign.category?.confirmed_category_id !== null) {
        // When confirmed_category_id exists, ProgramsSelectionStep will use it via selectedCategoryId atom
        // Check if it was originally from AI prediction or self-declared
        if (campaign.category?.predicted_category_accepted && campaign.category?.ai_predicted_category_id) {
          setSelectedCategoryForProceed("ai");
        } else if (campaign.category?.self_declared_category) {
          setSelectedCategoryForProceed("self");
        }
      } else if (campaign.category?.predicted_category_accepted && campaign.category?.ai_predicted_category_id) {
        setSelectedCategoryForProceed("ai");
      } else if (campaign.category?.self_declared_category) {
        setSelectedCategoryForProceed("self");
      }

      // Set category IDs in atoms - confirmed_category_id takes priority
      if (categoryId) {
        console.log("Setting category in atoms:", {
          categoryId,
          confirmed_category_id: campaign.category?.confirmed_category_id,
          self_declared_category: campaign.category?.self_declared_category,
          ai_predicted_category_id: campaign.category?.ai_predicted_category_id,
          determinedStep,
        });
        setSelectedCategory(categoryId);
        setSelfSelectedCategory(categoryId);

        // Get category label from categoryNames map
        const label = categoryNames[categoryId] || "";
        if (label) {
          setSelectedCategoryLabel(label);
          setSelfSelectedCategoryLabel(label);
        }
      } else {
        console.warn("No categoryId found for campaign:", campaign.id);
      }

      // Populate classificationResultAtom if ai_predicted_category_id is available
      // This is needed for CategoryMismatchStep to display the AI predicted category label
      if (campaign.category?.ai_predicted_category_id &&
        campaign.category.ai_predicted_category_id !== "None" &&
        campaign.category.ai_predicted_category_id !== null) {
        const aiPredictedCategoryId = campaign.category.ai_predicted_category_id;
        const aiPredictedCategoryLabel = categoryNames[aiPredictedCategoryId] || aiPredictedCategoryId;

        // Only set if classificationResult is not already set (to avoid overwriting fresh classification results)
        if (!classificationResult) {
          setClassificationResult({
            predicted_category: aiPredictedCategoryId,
            predicted_category_id: aiPredictedCategoryId,
            predicted_category_label: aiPredictedCategoryLabel,
            category_matched: campaign.category?.category_matched || false,
          });
        }
      }

      setLoadingCampaignData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignDetailsData, campaignIdFromQuery, isEditMode, categoryNames]);

  // Initialize campaign ID and load campaign details if editing
  useEffect(() => {
    if (campaignIdFromQuery && isEditMode) {
      setCampaignId(campaignIdFromQuery);
      setLoadingCampaignData(true);

      // Check if cached data exists and matches current campaign
      const cachedCampaign = campaignDetailsData?.campaign;
      if (cachedCampaign && cachedCampaign.id === campaignIdFromQuery) {
        // Use cached data, processing will happen in the other useEffect
        setLoadingCampaignData(false);
      } else {
        // Fetch campaign details (will be cached automatically by useApi)
        callCampaignDetails(fetchCampaignDetailsApi(campaignIdFromQuery), () => {
          setLoadingCampaignData(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignIdFromQuery, isEditMode]);

  const handleNextFromUpload = () => {
    if (!classificationResult) return;

    // Clear unsaved changes when moving to next step
    setHasUnsavedChanges(false);

    if (classificationResult.category_matched) {
      // Skip to programs selection
      setCurrentStep(5);
    } else {
      // Go to category mismatch step
      setCurrentStep(4);
    }
  };

  const handleProceedWithCategory = (categoryType: "ai" | "self" | null) => {
    setSelectedCategoryForProceed(categoryType);
    // Clear unsaved changes when moving to next step
    setHasUnsavedChanges(false);
    setCurrentStep(5);
  };

  const handleSkipUpload = () => {
    setSelectedCategory(selfSelectedCategory);
    setSelectedCategoryLabel(selfSelectedCategoryLabel);
    setSelectedCategoryForProceed("self");
    // Clear unsaved changes when moving to next step
    setHasUnsavedChanges(false);
    setCurrentStep(5);
  };

  const handleReturnToUpload = () => {
    setClassificationResult(null);
    setUploadResetKey((key) => key + 1);
    // Clear unsaved changes when going back
    setHasUnsavedChanges(false);
    setCurrentStep(3);
  };

  const handleComplete = () => {
    // Clear all campaign-related cache data and navigate to home
    clearAllCampaignCache();
    setHasUnsavedChanges(false);
    setSelectedCategoryForProceed(null);
    router.push("/");
  };

  const handleResetCampaign = () => {
    if (!campaignIdFromQuery) return;

    const confirmed = window.confirm(
      "Are you sure you want to reset this campaign? This will delete all saved programs and availability records. You will be redirected to the Program Selection page."
    );

    if (!confirmed) return;

    callResetCampaign(resetCampaignProgramsApi(campaignIdFromQuery), () => {
      toast.success("Campaign programs have been reset successfully");

      // Set flag to indicate we just reset - this will trigger processing in useEffect
      justResetRef.current = true;

      // Fetch campaign details to get updated confirmed_category_id
      // The useEffect will process the data when it arrives
      callCampaignDetails(fetchCampaignDetailsApi(campaignIdFromQuery));
    });
  };

  const handleProceedToBooking = () => {
    // Navigate to art file upload step (step 7)
    const campaignId = campaignIdFromQuery || campaignDetailsData?.campaign?.id;
    if (!campaignId) {
      toast.error("Campaign ID is missing");
      return;
    }
    // Ensure campaign ID is set in atom for ArtFileUploadStep
    setCampaignId(campaignId);
    setHasUnsavedChanges(false);
    setCurrentStep(7);
    router.replace(`/create-campaign?campaign_id=${campaignId}&step=7`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <DashboardNavbar />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => {
                // Check for unsaved changes first
                if (unsavedChangesDialogRef.current) {
                  // If there are unsaved changes, dialog will handle it
                  if (!unsavedChangesDialogRef.current.handleNavigationAttempt("/")) {
                    return; // Dialog will handle navigation after save/close
                  }
                }
                // No unsaved changes, clear cache and navigate to home
                handleBackToHome();
              }}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isEditMode ? "Edit Campaign" : "Create Campaign"}
                </h1>
                <p className="text-gray-600">
                  {isEditMode
                    ? "Continue editing your campaign from where you left off"
                    : "Follow the steps to create your campaign"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          {/* Step Content */}
          <Card>
            <CardContent className="pt-6">
              {/* Show loading when editing and loading campaign data for steps that need it */}
              {isEditMode && loadingCampaignData && (currentStep === 5 || currentStep === 6) ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                  <span className="ml-4 text-gray-600">Loading campaign data...</span>
                </div>
              ) : (
                <>
                  {/* Step 1: Create Campaign */}
                  {currentStep === 1 && (
                    <CreateCampaignStep onNext={() => setCurrentStep(2)} />
                  )}

                  {/* Step 2: Select Category */}
                  {currentStep === 2 && (
                    <CategorySelectionStep onNext={() => setCurrentStep(3)} />
                  )}

                  {/* Step 3: Upload and Classify */}
                  {currentStep === 3 && (
                    <UploadAndClassifyStep
                      key={uploadResetKey}
                      onNext={handleNextFromUpload}
                      onSkip={handleSkipUpload}
                    />
                  )}

                  {/* Step 4: Category Mismatch */}
                  {currentStep === 4 && (() => {
                    const category = campaignDetailsData?.campaign?.category;
                    const reviewStatus = category?.review_status || category?.manual_category_review;
                    const reviewStatusPending = isEditMode &&
                      reviewStatus &&
                      reviewStatus !== "None" &&
                      reviewStatus !== null &&
                      reviewStatus !== "";

                    return (
                      <CategoryMismatchStep
                        onNext={handleProceedWithCategory}
                        reviewStatusPending={reviewStatusPending}
                      />
                    );
                  })()}

                  {/* Step 5: Programs Selection */}
                  {currentStep === 5 && (
                    <ProgramsSelectionStep
                      selectedCategoryType={selectedCategoryForProceed}
                      onComplete={() => {
                        // Clear unsaved changes when completing step 5
                        setHasUnsavedChanges(false);
                        setCurrentStep(6);
                      }}
                      onBackToUpload={handleReturnToUpload}
                    />
                  )}

                  {/* Step 6: Availability Report */}
                  {currentStep === 6 && (
                    <AvailabilityReportStep
                      ref={availabilityReportStepRef}
                      onBack={() => setCurrentStep(5)}
                      onComplete={handleProceedToBooking}
                      useSavedPrograms={isEditMode && campaignIdFromQuery ? true : false}
                      isEditMode={isEditMode}
                      onProceedToBooking={handleProceedToBooking}
                      onResetCampaign={isEditMode ? handleResetCampaign : undefined}
                      resettingCampaign={resettingCampaign}
                    />
                  )}

                  {/* Step 7: Art File Upload */}
                  {currentStep === 7 && (
                    <ArtFileUploadStep
                      onBack={() => {
                        setCurrentStep(6);
                        router.replace(`/create-campaign?campaign_id=${campaignIdFromQuery}&step=6`);
                      }}
                      onNext={() => {
                        // Navigate to agreement page (step 8)
                        setHasUnsavedChanges(false);
                        setCurrentStep(8);
                        router.replace(`/create-campaign?campaign_id=${campaignIdFromQuery}&step=8`);
                      }}
                    />
                  )}

                  {/* Step 8: Agreement */}
                  {currentStep === 8 && (
                    <AgreementStep
                      onBack={() => {
                        setCurrentStep(7);
                        router.replace(`/create-campaign?campaign_id=${campaignIdFromQuery}&step=7`);
                      }}
                      onNext={() => {
                        // Complete campaign creation
                        clearAllCampaignCache();
                        setHasUnsavedChanges(false);
                        setSelectedCategoryForProceed(null);
                        router.push(`/`);
                      }}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Unsaved Changes Dialog - self-contained with all state management */}
        <UnsavedChangesDialog
          ref={unsavedChangesDialogRef}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={async () => {
            if (currentStep === 6 && availabilityReportStepRef.current) {
              await availabilityReportStepRef.current.savePrograms();
              toast.success("Changes saved successfully");
            }
            // Clear all cache after saving
            clearAllCampaignCache();
            setHasUnsavedChanges(false);
            setSelectedCategoryForProceed(null);
          }}
          onClearCache={() => {
            // Clear cache when closing without saving
            clearAllCampaignCache();
            setHasUnsavedChanges(false);
            setSelectedCategoryForProceed(null);
          }}
          onNavigate={(path) => {
            // If navigating to home, use handleBackToHome to ensure cache is cleared
            if (path === "/") {
              handleBackToHome();
            } else {
              router.push(path);
            }
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <DashboardNavbar />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    }>
      <CreateCampaignPageContent />
    </Suspense>
  );
}
