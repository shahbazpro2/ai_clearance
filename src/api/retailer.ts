import { universalApi } from "@/lib/universal-api";
import { responseApi, Axios } from "use-hook-api";

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
  send_email?: boolean;
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
 * 5.5 Get Account Audiences
 * Endpoint: GET /retailer/account-audiences
 */
export const getAccountAudiencesApi = () => {
  return universalApi("/retailer/account-audiences", "get");
};

/**
 * 5.1 GET Distributor / Account Stats
 * Endpoint: GET /retailer/distributor/stats
 */
export const getDistributorStatsApi = (isLive?: boolean) => {
  let url = "/retailer/distributor/stats";
  if (isLive !== undefined) {
    url += `?is_live=${isLive}`;
  }
  return universalApi(url, "get");
};

/** 16.1 Fetch retailer payments for authorized channels. */
export const fetchRetailerPaymentsApi = (payload: {
  channel_ids: string[];
  page: number;
  page_size: number;
}) => universalApi("/retailer/payments", "post", payload);

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
 * 7.3 Financial Contact (financial_contact)
 * Endpoint: POST /retailer/audience/setup/step
 */
export const financialContactApi = (payload: {
  audience_id: string;
  current_step_name: "financial_contact";
  form_data: {
    FirstName: string;
    LastName: string;
    Email: string;
    Phone: string;
  };
}) => {
  return responseApi("/retailer/audience/setup/step", "post", payload);
};

/**
 * 14.1 Create User (user_management)
 * Endpoint: POST /retailer/audience/setup/step
 */
export const createAccountUserApi = (payload: {
  audience_id?: string;
  current_step_name: "user_management";
  form_data: {
    contact_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: "retailer" | "finance";
    status: string;
  };
}) => {
  return responseApi("/retailer/audience/setup/step", "post", payload);
};

/**
 * 14.2 Update User Status (user_management)
 * Endpoint: POST /retailer/audience/setup/step
 */
export const updateAccountUserStatusApi = (payload: {
  audience_id?: string;
  current_step_name: "user_management";
  form_data: {
    contact_id: string;
    role: "retailer" | "finance";
    status: "active" | "inactive";
  };
}) => {
  return responseApi("/retailer/audience/setup/step", "post", payload);
};

/**
 * 14.3 Fetch Account Users (user_management)
 * Endpoint: GET /retailer/audience/setup/step/fetch
 */
export const fetchAccountUsersApi = () => {
  const queryParams = new URLSearchParams({
    current_step_name: "user_management",
  });
  return universalApi(
    `/retailer/audience/setup/step/fetch?${queryParams.toString()}`,
    "get",
  );
};

/**
 * 14.4 Verify User Management Step
 * Endpoint: GET /retailer/audience/setup/step/verify
 */
export const verifyUserManagementStepApi = (audienceId: string) => {
  const queryParams = new URLSearchParams({
    audience_id: audienceId,
    current_step_name: "user_management",
  });
  return universalApi(
    `/retailer/audience/setup/step/verify?${queryParams.toString()}`,
    "get",
  );
};

/**
 * 5.3 GET Distribution Centers by Channel
 * Endpoint: GET /retailer/audience-channel-distribution-centers?channel_id=...
 */
export const getDistributionCentersApi = (
  channelId: string,
  ignoreStatus?: boolean,
) => {
  let url = `/retailer/audience-channel-distribution-centers?channel_id=${encodeURIComponent(channelId)}`;
  if (ignoreStatus !== undefined) {
    url += `&ignore_status=${ignoreStatus}`;
  }
  return universalApi(url, "get");
};

/**
 * 5.4 Get US State Codes
 * Endpoint: GET /retailer/us-state-codes
 */
export const getUSStateCodesApi = () => {
  return universalApi("/retailer/us-state-codes", "get");
};

/**
 * 7.4 Distribution Center Setup (distribution_center)
 * Endpoint: POST /retailer/audience/setup/step
 */
export const distributionCenterSetupApi = (payload: {
  audience_id: string;
  current_step_name: "distribution_center";
  form_data: {
    channel_id: string;
    distribution_centers: Array<{
      allocation_percentage: number;
      city: string;
      country_code: string;
      distribution_center_name: string;
      distribution_center_salesforce_id: string | null;
      inventory_contact: {
        Email: string;
        FirstName: string;
        LastName: string;
        Phone: string;
      };
      ship_to_name: string;
      shipping_address_1: string;
      shipping_address_2: string;
      shipping_instructions: string;
      state: string;
      status: string;
      zip_code: string;
    }>;
  };
}) => {
  return responseApi("/retailer/audience/setup/step", "post", payload);
};

/**
 * 8.1 Verify Audience Setup Step
 * Endpoint: GET /retailer/audience/setup/step/verify
 */
export const verifyAudienceSetupStepApi = (payload: {
  audience_id: string;
  current_step_name: "distribution_center";
}) => {
  return universalApi(
    `/retailer/audience/setup/step/verify?audience_id=${encodeURIComponent(payload.audience_id)}&current_step_name=${encodeURIComponent(payload.current_step_name)}`,
    "get",
  );
};

/**
 * 11.1 Fetch Audience Profile Data (audience_data_collection)
 * Endpoint: GET /retailer/audience/setup/step/fetch
 */
export const fetchAudienceProfileDataApi = (payload: {
  audience_id: string;
}) => {
  const queryParams = new URLSearchParams({
    audience_id: payload.audience_id,
    current_step_name: "audience_data_collection",
  });
  return universalApi(
    `/retailer/audience/setup/step/fetch?${queryParams.toString()}`,
    "get",
  );
};

/**
 * 12.1 Get Monthly Shipment Projections by Channel
 * Endpoint: GET /retailer/audience/setup/monthly-shipment-projections/<channel_id>
 */
export const getMonthlyShipmentProjectionsByChannelApi = (
  channelId: string,
) => {
  return universalApi(
    `/retailer/audience/setup/monthly-shipment-projections/${encodeURIComponent(channelId)}`,
    "get",
  );
};

/**
 * 12.2 Save Monthly Shipment Projections
 * Endpoint: POST /retailer/audience/setup/step
 */
export const saveMonthlyShipmentProjectionsApi = (payload: {
  audience_id: string;
  channel_id: string;
  monthly_projections: {
    January: number | null;
    February: number | null;
    March: number | null;
    April: number | null;
    May: number | null;
    June: number | null;
    July: number | null;
    August: number | null;
    September: number | null;
    October: number | null;
    November: number | null;
    December: number | null;
  };
}) => {
  return responseApi("/retailer/audience/setup/step", "post", {
    audience_id: payload.audience_id,
    current_step_name: "monthly_shipment_projections",
    form_data: {
      channel_id: payload.channel_id,
      monthly_projections: payload.monthly_projections,
    },
  });
};

/**
 * 12.3 Verify Monthly Shipment Projections Step
 * Endpoint: GET /retailer/audience/setup/step/verify
 */
export const verifyMonthlyShipmentProjectionsStepApi = (payload: {
  audience_id: string;
}) => {
  return universalApi(
    `/retailer/audience/setup/step/verify?audience_id=${encodeURIComponent(payload.audience_id)}&current_step_name=monthly_shipment_projections`,
    "get",
  );
};

/**
 * 9.1 Fetch OMS Audience Details
 * Endpoint: GET /retailer/audience/setup/step/fetch
 */
export const fetchOMSAudienceDetailsApi = (payload: {
  audience_id: string;
  ignore_status?: boolean;
}) => {
  const queryParams = new URLSearchParams({
    audience_id: payload.audience_id,
    current_step_name: "oms_integration",
  });
  if (payload.ignore_status !== undefined) {
    queryParams.set("ignore_status", payload.ignore_status.toString());
  }
  return universalApi(
    `/retailer/audience/setup/step/fetch?${queryParams.toString()}`,
    "get",
  );
};

/**
 * 7.5 Distribution Center Setup (oms_integration)
 * Endpoint: POST /retailer/audience/setup/step
 */
export const omsIntegrationApi = (payload: {
  audience_id: string;
  current_step_name: "oms_integration";
  form_data: {
    distribution_center_salesforce_id: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    shipment_date: string;
  };
}) => {
  return responseApi("/retailer/audience/setup/step", "post", payload);
};

/**
 * 9.2 Verify OMS Integration Step
 * Endpoint: GET /retailer/audience/setup/step/verify
 */
export const verifyOMSIntegrationApi = (payload: { audience_id: string }) => {
  return universalApi(
    `/retailer/audience/setup/step/verify?audience_id=${encodeURIComponent(payload.audience_id)}&current_step_name=oms_integration`,
    "get",
  );
};

/**
 * 9.3 Download OMS DC Details PDF
 * Endpoint: POST /retailer/oms/pdf/download
 */
export const downloadOmsDcDetailsPdfApi = (
  audienceId: string,
): (() => Promise<any>) => {
  return () =>
    Axios.post<Blob>(
      "/retailer/oms/pdf/download",
      { audience_id: audienceId },
      { responseType: "blob" },
    ).then((res) => {
      const disposition = res.headers["content-disposition"];
      const match =
        typeof disposition === "string"
          ? disposition.match(/filename[*]?=(?:UTF-8'')?["']?([^"'\s]+)["']?/i)
          : null;
      const filename = match?.[1] ?? `oms_integration_${audienceId}.pdf`;
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return res;
    });
};

/**
 * 9.4 Fetch DC Shipment Logs
 * Endpoint: GET /retailer/oms/logs?distribution_center_id=...
 */
export const fetchDcShipmentLogsApi = (distributionCenterId: string) => {
  return universalApi(
    `/retailer/oms/logs?distribution_center_id=${encodeURIComponent(distributionCenterId)}`,
    "get",
  );
};

/**
 * 13.1 Get Monthly Projections and Shipment Logs by Channel
 * Endpoint: GET /retailer/projection-shipment-logs?channel_id=...
 */
export const getProjectionShipmentLogsByChannelApi = (channelId: string) => {
  return universalApi(
    `/retailer/projection-shipment-logs?channel_id=${encodeURIComponent(channelId)}`,
    "get",
  );
};

/**
 * 13.2 Submit Monthly Shipment Projection Change Request
 * Endpoint: POST /retailer/projection-shipment-logs/change-request
 */
export const submitProjectionChangeRequestApi = (payload: {
  channel_id: string;
  monthly_projections: Record<string, number>;
}) => {
  return responseApi(
    "/retailer/projection-shipment-logs/change-request",
    "post",
    payload,
  );
};

/**
 * 15.1 Get Brand Categories for Channel
 * Endpoint: GET /retailer/brand-categories?channel_id=...
 */
export const getBrandCategoriesApi = (channelId: string) => {
  return universalApi(
    `/retailer/brand-categories?channel_id=${encodeURIComponent(channelId)}`,
    "get",
  );
};

/**
 * 15.2 Get Category Brands
 * Endpoint: GET /retailer/category-brands?category_id=...&channel_id=...&page=...&limit=...&search=...
 */
export const getCategoryBrandsApi = (payload: {
  category_id: string;
  channel_id: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const queryParams = new URLSearchParams({
    category_id: payload.category_id,
    channel_id: payload.channel_id,
  });
  if (payload.page !== undefined) {
    queryParams.set("page", payload.page.toString());
  }
  if (payload.limit !== undefined) {
    queryParams.set("limit", payload.limit.toString());
  }
  if (payload.search) {
    queryParams.set("search", payload.search);
  }
  return universalApi(
    `/retailer/category-brands?${queryParams.toString()}`,
    "get",
  );
};

/**
 * 15.3 Save Category / Brand Approval Settings
 * Endpoint: POST /retailer/brand-approval-settings
 * Provide exactly one of category_id or brand_salesforce_id per request.
 */
export const saveBrandApprovalSettingsApi = (payload: {
  channel_id: string;
  category_id?: string;
  category_mode?: number;
  notifications_enabled?: boolean;
  automatically_approve?: boolean;
  brand_salesforce_id?: string;
  is_blocked?: boolean;
}) => {
  return responseApi("/retailer/brand-approval-settings", "post", payload);
};

/**
 * 15.4 Verify Brand Approval Settings Step
 * Endpoint: GET /retailer/audience/setup/step/verify?audience_id=...&current_step_name=brand_approval_settings
 */
export const verifyBrandApprovalSettingsStepApi = (audienceId: string) => {
  const queryParams = new URLSearchParams({
    audience_id: audienceId,
    current_step_name: "brand_approval_settings",
  });
  return universalApi(
    `/retailer/audience/setup/step/verify?${queryParams.toString()}`,
    "get",
  );
};

/**
 * 10.1 Get Orders by Channel
 * Endpoint: GET /retailer/audience-channel/<channel_id>/orders
 */
export const getChannelOrdersApi = (channelId: string) => {
  return universalApi(
    `/retailer/audience-channel/${encodeURIComponent(channelId)}/orders`,
    "get",
  );
};

/**
 * 10.2 Get Skids by Order
 * Endpoint: GET /retailer/orders/<order_id>/skids
 */
export const getOrderSkidsApi = (orderId: string) => {
  return universalApi(
    `/retailer/order/${encodeURIComponent(orderId)}/skid`,
    "get",
  );
};

/**
 * 10.3 Get Skid Update Logs
 * Endpoint: GET /retailer/skids/<skid_id>/update-logs
 */
export const getSkidUpdateLogsApi = (skidId: string) => {
  return universalApi(
    `/retailer/order/skid/${encodeURIComponent(skidId)}/update-logs`,
    "get",
  );
};
