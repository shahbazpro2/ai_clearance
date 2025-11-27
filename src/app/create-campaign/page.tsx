"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { DashboardNavbar } from "@/components/common/DashboardNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/store/campaign";

const TOTAL_STEPS = 6;

export default function CreateCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategoryForProceed, setSelectedCategoryForProceed] = useState<"ai" | "self" | null>(null);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const classificationResult = useAtomValue(classificationResultAtom);
  const setCampaignId = useSetAtom(campaignIdAtom);
  const setClassificationResult = useSetAtom(classificationResultAtom);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const setSelectedCategoryLabel = useSetAtom(selectedCategoryLabelAtom);

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
    // Navigate to home
    router.push("/");
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Campaign</h1>
            <p className="text-gray-600">Follow the steps to create your campaign</p>
          </div>

          {/* Progress Bar */}
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          {/* Step Content */}
          <Card>
            <CardContent className="pt-6">
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
                />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
