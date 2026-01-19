"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useApi } from "use-hook-api";
import { createCampaignApi } from "../../../../api/campaigns";
import { useSetAtom } from "jotai";
import { campaignIdAtom } from "@/store/campaign";

interface CreateCampaignStepProps {
  onNext: () => void;
}

export function CreateCampaignStep({ onNext }: CreateCampaignStepProps) {
  const [campaignName, setCampaignName] = useState("");
  const setCampaignId = useSetAtom(campaignIdAtom);
  const [callCreateCampaign, { loading: creatingCampaign }] = useApi({});

  const handleCreateCampaign = () => {
    const payload: { name?: string } = {};
    if (campaignName.trim()) {
      payload.name = campaignName.trim();
    }
    
    callCreateCampaign(createCampaignApi(payload), ({ data }: any) => {
      if (data?.id) {
        setCampaignId(data.id);
        onNext();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="max-w-md mx-auto py-8">
        <div className="space-y-4 mb-8">
          <Label htmlFor="campaign-name" className="text-base font-semibold text-gray-900">
            Campaign Name <span className="text-gray-500 font-normal text-sm">(Optional)</span>
          </Label>
          <Input
            id="campaign-name"
            type="text"
            placeholder="Enter campaign name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !creatingCampaign) {
                handleCreateCampaign();
              }
            }}
          />
          <p className="text-sm text-gray-500">
            You can skip this step if you prefer to name your campaign later.
          </p>
        </div>
        
        <div className="flex justify-center">
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
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

