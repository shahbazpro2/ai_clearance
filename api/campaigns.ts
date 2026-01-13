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
 * Endpoint: GET /programs/insert-programs?category={category_id}&campaign_id={campaign_id}
 */
export const fetchInsertProgramsApi = (
  category?: string,
  campaignId?: string
) => {
  const params = new URLSearchParams();
  if (category) {
    params.append("category_id", category);
  }
  if (campaignId) {
    params.append("campaign_id", campaignId);
  }
  const query = params.toString();
  return universalApi(
    `/programs/insert-programs${query ? `?${query}` : ""}`,
    "get"
  );
};

/**
 * Get Program Availability
 * Endpoint: POST /programs/availability
 */
export const getProgramAvailabilityApi = (payload: {
  channel_ids: string[];
  category_id: string;
  campaign_id?: string;
}) => {
  return responseApi("/programs/availability", "post", payload);
};

/**
 * Get Available Insert Print Types
 * Endpoint: GET /insert-print-types
 */
export const getInsertPrintTypesApi = () => {
  return universalApi(`/insert-print-types`, "get");
};

/**
 * Get Print Price Matrix for Selected Format
 * Endpoint: GET /print-price-matrix/{format}
 */
export const getPrintPriceMatrixApi = (format: string) => {
  return universalApi(`/print-price-matrix/${format}`, "get");
};

/**
 * Fetch Campaign Details
 * Endpoint: GET /campaigns/details?campaign_id={campaign_id}
 */
export const fetchCampaignDetailsApi = (campaignId: string) => {
  return universalApi(`/campaigns/details?campaign_id=${campaignId}`, "get");
};

/**
 * Save Campaign Programs
 * Endpoint: POST /programs/campaign-programs
 */
export const saveCampaignProgramsApi = (payload: any) => {
  return responseApi("/programs/campaign-programs", "post", payload);
};

/**
 * Create Manual Availability Check Request
 * Endpoint: POST /manual-availability/request
 */
export const createManualAvailabilityRequestApi = (payload: {
  campaign_id: string;
}) => {
  return responseApi("/manual-availability/request", "post", payload);
};

/**
 * Get Campaign Programs
 * Endpoint: GET /programs/campaign-programs/{campaign_id}
 */
export const getCampaignProgramsApi = (campaignId: string) => {
  return universalApi(`/programs/campaign-programs/${campaignId}`, "get");
};

/**
 * Reset Campaign Programs
 * Endpoint: DELETE /programs/campaign-programs/{campaign_id}/reset
 */
export const resetCampaignProgramsApi = (campaignId: string) => {
  return responseApi(
    `/programs/campaign-programs/${campaignId}/reset`,
    "delete"
  );
};

/**
 * Campaign Verification
 * Endpoint: GET /campaigns/verification?campaign_id={campaign_id}
 */
export const verifyCampaignApi = (campaignId: string) => {
  return universalApi(
    `/campaigns/verification?campaign_id=${campaignId}`,
    "get"
  );
};

/**
 * Get Art Files Details
 * Endpoint: GET /art-and-csv?campaign_id={campaign_id}
 */
export const getArtFilesDetailsApi = (campaignId: string) => {
  return universalApi(`/art-and-csv/?campaign_id=${campaignId}`, "get");
};

/**
 * Upload Art Files and Code Files
 * Endpoint: POST /art-and-csv/
 */
export const uploadArtFilesApi = (payload: FormData) => {
  return responseApi("/art-and-csv/", "post", payload);
};

/**
 * Delete Art Files
 * Endpoint: DELETE /art-and-csv/
 */
export const deleteArtFilesApi = (payload: {
  campaign_id: string;
  program_id: string;
  month_number: number;
}) => {
  return responseApi("/art-and-csv/", "delete", payload);
};

/**
 * Get Art and CSV Details for Agreement
 * Endpoint: GET /art-and-csv/details?campaign_id={campaign_id}
 */
export const getArtAndCsvDetailsApi = (campaignId: string) => {
  return universalApi(`/agreement/details?campaign_id=${campaignId}`, "get");
};

/**
 * Accept Agreement
 * Endpoint: POST /art-and-csv/accept
 */
export const acceptAgreementApi = (payload: { campaign_id: string }) => {
  return responseApi("/agreement/accept", "post", payload);
};
