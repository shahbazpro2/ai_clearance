"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useApi } from "use-hook-api";
import { fetchCategoriesApi } from "../../../../api/categories";
import { setCampaignCategoryApi } from "../../../../api/campaigns";
import { useAtomValue, useSetAtom } from "jotai";
import { campaignIdAtom, selectedCategoryAtom } from "@/store/campaign";

interface CategorySelectionStepProps {
  onNext: () => void;
}

export function CategorySelectionStep({ onNext }: CategorySelectionStepProps) {
  const campaignId = useAtomValue(campaignIdAtom);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  
  const [callFetchCategories, { data: categories, loading: loadingCategories }] = useApi({ errMsg: false });
  const [callSetCategory, { loading: settingCategory }] = useApi({});

  useEffect(() => {
    if (!categories || categories.length === 0) {
      callFetchCategories(fetchCategoriesApi());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (!campaignId || !selectedCategoryId) return;

    // Store the selected category name in Jotai
    setSelectedCategory(selectedCategoryId);

    callSetCategory(setCampaignCategoryApi({ campaign_id: campaignId, category: selectedCategoryId }), () => {
      onNext();
    });
  };

  return (
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
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category: any) => (
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
          onClick={handleNext}
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
  );
}

