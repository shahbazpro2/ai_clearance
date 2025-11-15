"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useApi } from "use-hook-api";
import { createCampaignApi } from "../../../../api/campaigns";
import { useSetAtom } from "jotai";
import { campaignIdAtom } from "@/store/campaign";

interface CreateCampaignStepProps {
  onNext: () => void;
}

export function CreateCampaignStep({ onNext }: CreateCampaignStepProps) {
  const setCampaignId = useSetAtom(campaignIdAtom);
  const [callCreateCampaign, { loading: creatingCampaign }] = useApi({});

  const handleCreateCampaign = () => {
    callCreateCampaign(createCampaignApi({}), ({ data }: any) => {
      if (data?.id) {
        setCampaignId(data.id);
        onNext();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <p className="text-gray-700 mb-6 text-lg">
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
  );
}

