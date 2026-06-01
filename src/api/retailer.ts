import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

/**
 * 4.1 Get Channel Category Status
 * Endpoint: GET /retailer/channels/category-status?channel_id=...
 */
export const getChannelCategoryStatusApi = (channelId: string) => {
  return universalApi(
    `/retailer/channels/category-status?channel_id=${encodeURIComponent(channelId)}`,
    "get",
  );
};

/**
 * 4.2 Update Channel Category Status
 * Endpoint: POST /retailer/channels/category-status/update
 */
export const updateChannelCategoryStatusApi = (payload: {
  channel_id: string;
  category_ids: Array<{ id: string; is_blocked: boolean }>;
}) => {
  return responseApi(
    "/retailer/channels/category-status/update",
    "post",
    payload,
  );
};

/**
 * 4.3 View GCP Insert Images
 * Endpoint: POST /retailer/view-gcp/insert-images
 */
export const viewGcpInsertImagesApi = (payload: {
  category_id: string;
  page: number;
  limit: number;
}) => {
  return responseApi("/retailer/view-gcp/insert-images", "post", payload);
};

/**
 * 4.4 Skip Category Selection
 * Endpoint: POST /retailer/channel/blocked-category/skip
 */
export const skipCategorySelectionApi = (payload: { channel_id: string }) => {
  return responseApi(
    "/retailer/channel/blocked-category/skip",
    "post",
    payload,
  );
};

/**
 * 5.1 GET Distributor / Account Stats
 * Endpoint: GET /retailer/distributor/stats
 */
export const getDistributorStatsApi = () => {
  return universalApi("/retailer/distributor/stats", "get");
};

/**
 * 5.2 GET Audience Channels
 * Endpoint: GET /retailer/audience-channels?audience_id=...
 */
export const getAudienceChannelsApi = (audienceId: string) => {
  return universalApi(
    `/retailer/audience-channels?audience_id=${encodeURIComponent(audienceId)}`,
    "get",
  );
};

/**
 * 6.1 Fetch All Categories (with optional type filter)
 * Endpoint: GET /taxonomy/categories?type=audience
 */
export const fetchAudienceCategoriesApi = (type?: string) => {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  return universalApi(`/taxonomy/categories${query}`, "get");
};

/**
 * 7.1 Audience Setup Step 1 (audience_data_collection)
 * Endpoint: POST /retailer/audience/setup/step
 */
export const audienceSetupStep1Api = (payload: {
  audience_id: string;
  current_step_name: "audience_data_collection";
  form_data: {
    Category__c: number | string;
    Website__c: string;
    Age__c: number;
    Income__c: number;
    Female__c: number;
    Male__c: number;
    Average_Order_Value__c: number;
    Monthly_New_Customer_Percentage__c: number;
    Annual_Customer_Order_Frequency__c: number;
  };
}) => {
  return responseApi("/retailer/audience/setup/step", "post", payload);
};

/**
 * 7.2 Verify Category Selection (blocked_categories_verification)
 * Endpoint: POST /retailer/audience/setup/step
 */
export const verifyCategorySelectionApi = (payload: {
  audience_id: string;
  current_step_name: "blocked_categories_verification";
}) => {
  return responseApi("/retailer/audience/setup/step", "post", payload);
};
