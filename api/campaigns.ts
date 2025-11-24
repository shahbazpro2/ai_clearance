import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

/**
 * Fetch all campaigns records by users
 * Endpoint: GET /campaigns
 */
export const fetchCampaignsApi = () => {
  return universalApi(`/campaigns`, "get");
};

/**
 * Create Campaign
 * Endpoint: POST /campaigns
 */
export const createCampaignApi = (payload: any) => {
  return responseApi("/campaigns", "post", payload);
};

/**
 * Campaign Self Declared Category
 * Endpoint: PUT /campaigns/{campaign_id}/category
 */
export const setCampaignCategoryApi = (payload: {
  campaign_id: string;
  category: string;
}) => {
  return responseApi(`/campaigns/self-declared-category`, "post", {
    campaign_id: payload.campaign_id,
    category_id: payload.category,
  });
};

/**
 * Campaign Accept Predicted Category
 * Endpoint: PUT /campaigns/{campaign_id}/accept-predicted-category
 */
export const acceptPredictedCategoryApi = (campaignId: string) => {
  return responseApi(`/campaigns/accept-predicted-category`, "post", {
    campaign_id: campaignId,
  });
};

/**
 * Create Manual Review
 * Endpoint: POST /manual-review/manual-reviews
 */
export const createManualReviewApi = (payload: { campaign_id: string }) => {
  return responseApi("/manual-review/manual-reviews", "post", payload);
};

/**
 * Fetch Insert Programs
 * Endpoint: GET /programs/insert-programs?category={category_id}
 */
export const fetchInsertProgramsApi = (category?: string) => {
  const query = category ? `?category_id=${encodeURIComponent(category)}` : "";
  return universalApi(`/programs/insert-programs${query}`, "get");
};
