import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

/**
 * 2.1 Get Authorized Distribution Centers
 * Endpoint: GET /distribution-centers
 */
export const getAuthorizedDistributionCentersApi = () => {
  return universalApi("/inventory/distribution-centers", "get");
};

/**
 * 2.2 Get Distribution Center Inventory
 * Endpoint: GET /distribution-centers/<salesforce_dc_id>/inventory
 * The API paginates booking months — pass `page` / `page_size` when needed.
 */
export const getDistributionCenterInventoryApi = (
  salesforceDcId: string,
  options?: { page?: number; page_size?: number },
) => {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.page_size) params.set("page_size", String(options.page_size));
  const query = params.toString();
  return universalApi(
    `/inventory/distribution-centers/${encodeURIComponent(salesforceDcId)}/inventory${query ? `?${query}` : ""}`,
    "get",
  );
};

/**
 * 2.3 Submit Skid Updates
 * Endpoint: POST /skid-updates
 */
export const submitSkidUpdatesApi = (payload: {
  updates: Array<{
    skid_id: string;
    cartons_remaining: number;
  }>;
}) => {
  return universalApi("/inventory/skid-updates", "post", payload);
};
