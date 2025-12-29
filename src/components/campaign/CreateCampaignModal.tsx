"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useApi } from "use-hook-api";
import { createCampaignApi, setCampaignCategoryApi, acceptPredictedCategoryApi, createManualReviewApi } from "../../../api/campaigns";
import { classifyCategoryApi } from "../../../api/categories";
import { useCategories } from "@/hooks/useCategories";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

interface ClassificationResult {
  predicted_category: string;
  category_matched: boolean;
  [key: string]: any;
}

const TOTAL_STEPS = 5;

export function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [selectedCategoryForProceed, setSelectedCategoryForProceed] = useState<"ai" | "self" | null>(null);
  const [manualReviewRequested, setManualReviewRequested] = useState(false);

  const { categories, loading: loadingCategories } = useCategories();
  const [callCreateCampaign, { loading: creatingCampaign }] = useApi({ errMsg: true });
  const [callSetCategory, { loading: settingCategory }] = useApi({ errMsg: true });
  const [callClassify, { loading: classifying }] = useApi({ errMsg: true });
  const [callAcceptPredicted, { loading: acceptingPredicted }] = useApi({ errMsg: true });
  const [callCreateReview, { loading: creatingReview }] = useApi({ errMsg: true });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setCampaignId(null);
      setSelectedCategoryId("");
      setUploadedFile(null);
      setClassificationResult(null);
      setSelectedCategoryForProceed(null);
      setManualReviewRequested(false);
    }
  }, [isOpen]);

  // Step 1: Create Campaign
  const handleCreateCampaign = () => {
    callCreateCampaign(createCampaignApi({}), ({ data }: any) => {
      if (data?.id) {
        setCampaignId(data.id);
        setCurrentStep(2);
      }
    });
  };

  // Step 2: Select Category
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleNextFromCategory = () => {
    if (!campaignId || !selectedCategoryId) return;

    callSetCategory(setCampaignCategoryApi({ campaign_id: campaignId, category: selectedCategoryId }), () => {
      setCurrentStep(3);
    });
  };

  // Step 3: Upload and Classify
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setClassificationResult(null);
    }
  };

  const handleClassify = () => {
    if (!uploadedFile || !campaignId) return;

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("campaign_id", campaignId);

    callClassify(classifyCategoryApi(formData), ({ data }: any) => {
      setClassificationResult({
        predicted_category: data?.predicted_category || "",
        category_matched: data?.category_matched || false,
      });
    });
  };

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

  // Step 4: Category Mismatch Handling
  const handleAcceptPredicted = () => {
    if (!campaignId) return;

    callAcceptPredicted(acceptPredictedCategoryApi(campaignId), () => {
      setCurrentStep(5);
    });
  };

  const handleRequestManualReview = () => {
    if (!campaignId) return;

    callCreateReview(createManualReviewApi({ campaign_id: campaignId }), () => {
      setManualReviewRequested(true);
    });
  };

  const handleProceedWithCategory = (categoryType: "ai" | "self") => {
    setSelectedCategoryForProceed(categoryType);
    setCurrentStep(5);
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Follow the steps to create your campaign
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step 1: Create Campaign */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-700 mb-6">
                Welcome to the campaign creation process. Click the button below to start creating your campaign.
              </p>
              <Button
                onClick={handleCreateCampaign}
                disabled={creatingCampaign}
                size="lg"
                className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
              >
                {creatingCampaign ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    Creating Campaign...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Category */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <Select value={selectedCategoryId} onValueChange={handleCategorySelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.category}>
                        {category.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleNextFromCategory}
                disabled={!selectedCategoryId || settingCategory}
                className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
              >
                {settingCategory ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    Saving...
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Sample Insert */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Sample Insert
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG (Max 10MB)</p>
                </label>
              </div>
            </div>

            {uploadedFile && (
              <div>
                <Button
                  onClick={handleClassify}
                  disabled={classifying}
                  className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90"
                >
                  {classifying ? (
                    <>
                      <LoadingSpinner className="mr-2" size="sm" />
                      Classifying...
                    </>
                  ) : (
                    "Classify"
                  )}
                </Button>
              </div>
            )}

            {classifying && (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {classificationResult && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Predicted Category:</span>
                      <span className="text-sm text-gray-700">{classificationResult.predicted_category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Category Matched:</span>
                      {classificationResult.category_matched ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {classificationResult && (
              <div className="flex justify-end">
                <Button
                  onClick={handleNextFromUpload}
                  className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Category Mismatch */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    Category Mismatch Detected
                  </p>
                  <p className="text-sm text-yellow-700">
                    The AI predicted category differs from your selected category. Please choose how to proceed.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleAcceptPredicted}
                disabled={acceptingPredicted}
                variant="outline"
                className="w-full"
              >
                {acceptingPredicted ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    Updating...
                  </>
                ) : (
                  "Accept Predicted Category"
                )}
              </Button>

              <Button
                onClick={handleRequestManualReview}
                disabled={creatingReview || manualReviewRequested}
                variant="outline"
                className="w-full"
              >
                {creatingReview ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    Requesting...
                  </>
                ) : manualReviewRequested ? (
                  "Manual Review Requested"
                ) : (
                  "Request Manual Review"
                )}
              </Button>
            </div>

            {manualReviewRequested && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-4">
                    You can proceed with campaign creation while your review is pending. Choose which category to continue with:
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleProceedWithCategory("ai")}
                      variant="outline"
                      className="w-full"
                    >
                      Proceed with AI-Predicted Category
                    </Button>
                    <Button
                      onClick={() => handleProceedWithCategory("self")}
                      variant="outline"
                      className="w-full"
                    >
                      Proceed with Self-Declared Category
                    </Button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    ⚠️ You cannot proceed with booking (payment and other operations) until the category is verified.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Programs Selection */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Programs Selection</h3>
              <p className="text-sm text-gray-600 mb-4">
                Retailer endpoint is not ready yet. This step will be implemented once the endpoint is available.
              </p>
              {selectedCategoryForProceed && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    Selected category: {selectedCategoryForProceed === "ai" ? "AI-Predicted" : "Self-Declared"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
              >
                Complete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

