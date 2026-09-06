import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

// 2.1 Get All Admin Users
export const fetchAdminUsersApi = (params?: {
  status?: "active" | "pending" | "suspended" | "rejected";
  page?: number;
  per_page?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.page != null) {
    queryParams.append("page", String(params.page));
  }
  if (params?.per_page != null) {
    queryParams.append("per_page", String(params.per_page));
  }
  const queryString = queryParams.toString();
  const url = `/admin/users${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

// 2.2 Set Admin Users Status
export const setAdminUserStatusApi = (payload: {
  user_id: string;
  status: "active" | "pending" | "suspended" | "rejected";
}) => {
  return responseApi("/admin/users/set/status", "post", payload);
};

// 10.1 GET Retailer-Account-Users
export const fetchRetailerAccountsUsersApi = (params?: {
  status?: "active" | "inactive";
  user_status?: "active" | "inactive";
  page?: number;
  per_page?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.user_status) {
    queryParams.append("user_status", params.user_status);
  }
  if (params?.page != null) {
    queryParams.append("page", String(params.page));
  }
  if (params?.per_page != null) {
    queryParams.append("per_page", String(params.per_page));
  }
  const queryString = queryParams.toString();
  const url = `/admin/retailers-info${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

// 10.2 Update Retailer-Account-Users Status
export const updateRetailerAccountStatusApi = (payload: {
  account_id: string;
  account_status?: "active" | "inactive";
  user?: {
    contact_id: string;
    status: "active" | "inactive";
  };
}) => {
  return responseApi("/admin/retailers-info/status/update", "patch", payload);
};

// 10.3 Sync All Salesforce Retailer Accounts Users
export const syncAllSalesforceRetailingApi = () => {
  return responseApi("/admin/sync-salesforce", "post", {});
};

// 10.4 Sync Specific Salesforce Retailer Accounts Users
export const syncSpecificSalesforceRetailerApi = (payload: {
  account_id: string;
}) => {
  return responseApi("/admin/sync-salesforce/account-users", "post", payload);
};

// 10.5 GET Sync Salesforce Job Stats
export const fetchSyncSalesforceJobStatsApi = (sync_job_id: string) => {
  const params = new URLSearchParams({ sync_job_id });
  return universalApi(
    `/admin/sync-salesforce/job-stats?${params.toString()}`,
    "get",
  );
};

// 10.6 DELETE Sync Salesforce Record
export const deleteRetailerRecordApi = (
  params:
    | { account_id: string }
    | { contact_id: string }
    | { audience_id: string }
    | { channel_id: string }
) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return responseApi(`/admin/retailer-account?${query}`, "delete", {});
};

// 11.1 Fetch Monthly Projection Change Requests
export const fetchMonthlyProjectionRequestsApi = (params?: {
  status?: "pending" | "approved" | "rejected";
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  const queryString = queryParams.toString();
  const url = `/admin/projection-requests${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

// 11.2 Update Monthly Shipment Projection Request Status
export const updateProjectionRequestStatusApi = (payload: {
  request_id: string;
  status: number; // 1 = Approved, 0 = Rejected
}) => {
  return responseApi("/admin/projection-requests/status", "patch", payload);
};
