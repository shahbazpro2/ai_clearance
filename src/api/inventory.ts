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
 */
export const getDistributionCenterInventoryApi = (
  salesforceDcId: string,
) => {
  return universalApi(
    `/inventory/distribution-centers/${encodeURIComponent(salesforceDcId)}/inventory`,
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
