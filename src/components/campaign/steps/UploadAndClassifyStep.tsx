"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AnimatedLoader } from "@/components/ui/animated-loader";
import { Upload, CheckCircle2, XCircle, X, ArrowLeft, Sparkles } from "lucide-react";
import { useApi } from "use-hook-api";
import { classifyCategoryApi } from "../../../../api/categories";
import { useAtomValue, useSetAtom } from "jotai";
import { campaignIdAtom, classificationResultAtom, ClassificationResult } from "@/store/campaign";

interface UploadAndClassifyStepProps {
  onNext: () => void;
}

export function UploadAndClassifyStep({ onNext }: UploadAndClassifyStepProps) {
  const campaignId = useAtomValue(campaignIdAtom);
  const setClassificationResult = useSetAtom(classificationResultAtom);
  const classificationResult = useAtomValue(classificationResultAtom);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [callClassify, { loading: classifying }] = useApi({ errMsg: true });

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
      const result: ClassificationResult = {
        predicted_category: data?.predicted_category || "",
        category_matched: data?.category_matched || false,
      };
      setClassificationResult(result);
    });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setClassificationResult(null);
    // Clear the file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleBackToUpload = () => {
    setUploadedFile(null);
    setClassificationResult(null);
    // Clear the file input
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleNext = () => {
    if (!classificationResult) return;
    onNext();
  };

  return (
    <div className="space-y-6">
      {!classificationResult && !classifying && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Sample Insert (PDF or Image)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors relative">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-sm text-gray-700 font-medium">{uploadedFile.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">PDF or Image (JPG, PNG, WEBP, GIF) - Max 10MB</p>
                </div>
              ) : (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF or Image (JPG, PNG, WEBP, GIF) - Max 10MB</p>
                </label>
              )}
            </div>
          </div>

          {uploadedFile && (
            <div>
              <Button
                onClick={handleClassify}
                disabled={classifying}
                className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Classify File
              </Button>
            </div>
          )}
        </>
      )}

      {classifying && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/20 shadow-lg">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Improved animated loader */}
              <div className="relative w-24 h-24">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                
                {/* Middle pulsing circle */}
                <div className="absolute inset-4 bg-primary rounded-full animate-pulse opacity-75"></div>
                
                {/* Inner sparkles icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-xl font-bold text-gray-800 animate-pulse">
                  Analyzing Your File
                </h3>
                <p className="text-sm text-gray-600 max-w-md leading-relaxed">
                  Our AI is processing your file to identify the category. This may take a few moments...
                </p>
              </div>

              {/* Improved progress bar with smooth animation */}
              <div className="w-full max-w-sm space-y-2">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
                  <div 
                    className="h-full bg-blue-gradient rounded-full relative overflow-hidden"
                    style={{ 
                      width: '75%',
                      animation: 'progressPulse 2s ease-in-out infinite'
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{
                        animation: 'shimmer 1.5s ease-in-out infinite'
                      }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">Processing...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {classificationResult && (
        <>
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Predicted Category:</span>
                  <span className="text-sm text-gray-700">{classificationResult.predicted_category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Category Matched:</span>
                  {classificationResult.category_matched ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-600">No</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button
              onClick={handleBackToUpload}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Upload Again
            </Button>
            <Button
              onClick={handleNext}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

