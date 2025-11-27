"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertTriangle } from "lucide-react";
import { useApi } from "use-hook-api";
import { acceptPredictedCategoryApi, createManualReviewApi } from "../../../../api/campaigns";
import { useAtomValue, useSetAtom } from "jotai";
import {
  campaignIdAtom,
  classificationResultAtom,
  selectedCategoryAtom,
  selectedCategoryLabelAtom,
  selfSelectedCategoryAtom,
  selfSelectedCategoryLabelAtom,
} from "@/store/campaign";

interface CategoryMismatchStepProps {
  onNext: (categoryType: "ai" | "self" | null) => void;
}

export function CategoryMismatchStep({ onNext }: CategoryMismatchStepProps) {
  const campaignId = useAtomValue(campaignIdAtom);
  const selectedCategoryId = useAtomValue(selectedCategoryAtom);
  const selectedCategoryLabel = useAtomValue(selectedCategoryLabelAtom);
  const selfSelectedCategory = useAtomValue(selfSelectedCategoryAtom);
  const selfSelectedCategoryLabel = useAtomValue(selfSelectedCategoryLabelAtom);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const setSelectedCategoryLabel = useSetAtom(selectedCategoryLabelAtom);
  const classificationResult = useAtomValue(classificationResultAtom);
  const [manualReviewRequested, setManualReviewRequested] = useState(false);

  const [callAcceptPredicted, { loading: acceptingPredicted }] = useApi({ errMsg: true });
  const [callCreateReview, { loading: creatingReview }] = useApi({ errMsg: true });

  const predictedCategoryId =
    classificationResult?.predicted_category_id ??
    classificationResult?.predicted_category ??
    null;
  const predictedCategoryLabel =
    classificationResult?.predicted_category_label ??
    classificationResult?.predicted_category ??
    predictedCategoryId ??
    null;

  const applyPredictedSelection = () => {
    if (predictedCategoryId) {
      setSelectedCategory(predictedCategoryId);
    }
    setSelectedCategoryLabel(predictedCategoryLabel);
  };

  const applySelfSelection = () => {
    setSelectedCategory(selfSelectedCategory);
    setSelectedCategoryLabel(selfSelectedCategoryLabel);
  };

  const handleAcceptPredicted = () => {
    if (!campaignId) return;

    callAcceptPredicted(acceptPredictedCategoryApi(campaignId), () => {
      applyPredictedSelection();
      onNext("ai");
    });
  };

  const handleRequestManualReview = () => {
    if (!campaignId) return;

    callCreateReview(createManualReviewApi({ campaign_id: campaignId }), () => {
      setManualReviewRequested(true);
    });
  };

  const handleProceedWithCategory = (categoryType: "ai" | "self") => {
    if (categoryType === "ai") {
      applyPredictedSelection();
    } else {
      applySelfSelection();
    }
    onNext(categoryType);
  };

  return (
    <div className="space-y-6">
      {!manualReviewRequested && (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
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
        </>
      )}

      {manualReviewRequested && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 mb-1">
              Manual Review Requested Successfully
            </p>
            <p className="text-sm text-green-700 mb-4">
              You can proceed with campaign creation while your review is pending. Choose which category to continue with:
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => handleProceedWithCategory("self")}
                className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90"
              >
                Go with Selected Category: {selectedCategoryLabel || selectedCategoryId || "N/A"}
              </Button>
              <Button
                onClick={() => handleProceedWithCategory("ai")}
                variant="outline"
                className="w-full"
              >
                Go with AI Predicted Category:{" "}
                {classificationResult?.predicted_category_label ||
                  classificationResult?.predicted_category ||
                  "N/A"}
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
  );
}

