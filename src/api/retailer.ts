import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

/**
 * 4.1 Get Channel Category Status
 * Endpoint: GET /retailer/channels/category-status?channel_id=...
 */
export const getChannelCategoryStatusApi = (channelId: string) => {
  return universalApi(
    `/retailer/channels/category-status?channel_id=${encodeURIComponent(channelId)}`,
    "get"
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
  return responseApi("/retailer/channels/category-status/update", "post", payload);
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
