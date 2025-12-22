"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { DashboardNavbar } from "@/components/common/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft } from "lucide-react";
import {
  CreateCampaignStep,
  CategorySelectionStep,
  UploadAndClassifyStep,
  CategoryMismatchStep,
  ProgramsSelectionStep,
  AvailabilityReportStep,
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
} from "@/store/campaign";
import { fetchCampaignDetailsApi, resetCampaignProgramsApi } from "../../../api/campaigns";
import { fetchCategoriesApi } from "../../../api/categories";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import { RotateCcw } from "lucide-react";

const TOTAL_STEPS = 6;

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
  const classificationResult = useAtomValue(classificationResultAtom);
  const selfSelectedCategory = useAtomValue(selfSelectedCategoryAtom);
  const selfSelectedCategoryLabel = useAtomValue(selfSelectedCategoryLabelAtom);
  const setCampaignId = useSetAtom(campaignIdAtom);
  const setClassificationResult = useSetAtom(classificationResultAtom);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const setSelectedCategoryLabel = useSetAtom(selectedCategoryLabelAtom);
  const setSelfSelectedCategory = useSetAtom(selfSelectedCategoryAtom);
  const setSelfSelectedCategoryLabel = useSetAtom(selfSelectedCategoryLabelAtom);

  const [callCampaignDetails, { loading: loadingDetails }] = useApi({ errMsg: false });
  const [callFetchCategories, { loading: loadingCategories }] = useApi({ errMsg: false });
  const [callResetCampaign, { loading: resettingCampaign }] = useApi({ errMsg: true });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
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
  }, [hasUnsavedChanges]);

  // Track unsaved changes when navigating away
  useEffect(() => {
    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        const shouldLeave = window.confirm(
          "Do you want to save changes or close without saving?\n\nClick OK to leave without saving, or Cancel to stay."
        );
        if (!shouldLeave) {
          router.push(`/create-campaign?campaign_id=${campaignIdFromQuery}&step=${currentStep}`);
        }
      }
    };

    // Note: Next.js router events are handled differently
    // This is a basic implementation
  }, [hasUnsavedChanges, currentStep, campaignIdFromQuery, router]);

  // Determine correct step based on current_stage and campaign details
  const determineStepFromStage = (campaign: any): number => {
    const currentStage = campaign.current_stage;
    const category = campaign.category || {};

    // Stage mapping
    if (currentStage === "category_verification" || currentStage === "category_selection") {
      // 1. Check self_declared_category
      if (!category.self_declared_category || category.self_declared_category === "None") {
        return 2; // Category Selection Step
      }

      // 2. Check ai_predicted_category
      if (!category.ai_predicted_category_id || category.ai_predicted_category_id === "None") {
        return 3; // Upload and Classify Step
      }

      // 3. Check confirmed_category_id
      if (category.confirmed_category_id && category.confirmed_category_id !== "None") {
        return 5; // Programs Selection Step
      }

      // 4. Check manual_category_review
      const reviewStatus = category.review_status || category.manual_category_review;
      if (!reviewStatus || reviewStatus === "None") {
        return 4; // Category Mismatch Step (accept AI or submit manual review)
      } else {
        return 4; // Category Mismatch Step (select AI or self declared)
      }
    }

    if (currentStage === "program_selection" || currentStage === "programs_selection") {
      // 1. Check confirmed_category_id
      if (category.confirmed_category_id && category.confirmed_category_id !== "None") {
        return 5; // Programs Selection Step
      }

      // 2. Check ai_predicted_category
      if (!category.ai_predicted_category_id || category.ai_predicted_category_id === "None") {
        return 3; // Upload and Classify Step
      }

      // 3. Check manual_category_review
      const reviewStatus = category.review_status || category.manual_category_review;
      if (!reviewStatus || reviewStatus === "None") {
        return 4; // Category Mismatch Step (accept AI or submit manual review)
      } else {
        return 4; // Category Mismatch Step (select AI or self declared)
      }
    }

    if (currentStage === "availability_planning") {
      return 6; // Availability Report Step
    }

    // Default: use step from query or start from beginning
    if (stepFromQuery) {
      const step = parseInt(stepFromQuery, 10);
      return step >= 1 && step <= TOTAL_STEPS ? step : 1;
    }

    return 1;
  };

  // Initialize campaign ID and load campaign details if editing
  useEffect(() => {
    if (campaignIdFromQuery && isEditMode) {
      setCampaignId(campaignIdFromQuery);
      setLoadingCampaignData(true);

      // Load campaign details to populate form fields and atoms
      callCampaignDetails(fetchCampaignDetailsApi(campaignIdFromQuery), ({ data }: any) => {
        if (data?.campaign) {
          const campaign = data.campaign;

          // Determine correct step based on stage
          const determinedStep = determineStepFromStage(campaign);
          setCurrentStep(determinedStep);

          // Determine which category to use
          const categoryId = campaign.category?.confirmed_category_id
            || campaign.category?.self_declared_category
            || campaign.category?.ai_predicted_category_id
            || null;

          // Determine category type for ProgramsSelectionStep
          if (campaign.category?.predicted_category_accepted && campaign.category?.ai_predicted_category_id) {
            setSelectedCategoryForProceed("ai");
          } else if (campaign.category?.self_declared_category) {
            setSelectedCategoryForProceed("self");
          }

          // Set category IDs in atoms
          if (categoryId) {
            setSelectedCategory(categoryId);
            setSelfSelectedCategory(categoryId);

            // Fetch category label
            callFetchCategories(fetchCategoriesApi(), ({ data: categoriesData }: any) => {
              const categories = categoriesData?.categories || categoriesData || [];
              const category = categories.find(
                (cat: any) => String(cat.id || cat.category) === String(categoryId)
              );
              if (category) {
                const label = category.category || category.name || category.label || category.title || "";
                setSelectedCategoryLabel(label);
                setSelfSelectedCategoryLabel(label);
              }
              setLoadingCampaignData(false);
            });
          } else {
            setLoadingCampaignData(false);
          }
        } else {
          setLoadingCampaignData(false);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignIdFromQuery, isEditMode]);

  const handleNextFromUpload = () => {
    if (!classificationResult) return;

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
    setCurrentStep(5);
  };

  const handleSkipUpload = () => {
    setSelectedCategory(selfSelectedCategory);
    setSelectedCategoryLabel(selfSelectedCategoryLabel);
    setSelectedCategoryForProceed("self");
    setCurrentStep(5);
  };

  const handleReturnToUpload = () => {
    setClassificationResult(null);
    setUploadResetKey((key) => key + 1);
    setCurrentStep(3);
  };

  const handleComplete = () => {
    // Clear all campaign-related cache data
    setCampaignId(null);
    setClassificationResult(null);
    setSelectedCategory(null);
    setSelectedCategoryLabel(null);
    setSelfSelectedCategory(null);
    setSelfSelectedCategoryLabel(null);
    setHasUnsavedChanges(false);
    // Navigate to home
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
      // Redirect to Program Selection page
      setCurrentStep(5);
      setHasUnsavedChanges(false);
      // Clear program-related state
      setSelectedCategoryForProceed(null);
    });
  };

  const handleProceedToBooking = () => {
    // TODO: Implement booking functionality when backend is ready
    toast.info("Proceed to booking feature is coming soon");
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
              onClick={() => router.push("/")}
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
              {isEditMode && (currentStep === 5 || currentStep === 6) && (
                <div className="flex items-center gap-2">
                  {currentStep === 6 && (
                    <Button
                      variant="default"
                      onClick={handleProceedToBooking}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Proceed to Booking
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleResetCampaign}
                    disabled={resettingCampaign}
                    className="flex items-center gap-2"
                  >
                    {resettingCampaign ? (
                      <>
                        <LoadingSpinner size="sm" className="h-4 w-4" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Reset Campaign
                      </>
                    )}
                  </Button>
                </div>
              )}
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
                  {currentStep === 4 && (
                    <CategoryMismatchStep onNext={handleProceedWithCategory} />
                  )}

                  {/* Step 5: Programs Selection */}
                  {currentStep === 5 && (
                    <ProgramsSelectionStep
                      selectedCategoryType={selectedCategoryForProceed}
                      onComplete={() => setCurrentStep(6)}
                      onBackToUpload={handleReturnToUpload}
                    />
                  )}

                  {/* Step 6: Availability Report */}
                  {currentStep === 6 && (
                    <AvailabilityReportStep
                      onBack={() => setCurrentStep(5)}
                      onComplete={handleComplete}
                      useSavedPrograms={isEditMode && campaignIdFromQuery ? true : false}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>
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
