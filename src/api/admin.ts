import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

// 2.1 Get All Admin Users
export const fetchAdminUsersApi = (params?: {
  status?: "active" | "pending" | "suspended" | "rejected" | "inactive";
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

// 2.3 Create Admin User
export const createAdminUserApi = (payload: {
  name: string;
  email: string;
  password?: string;
}) => {
  return responseApi("/admin/users/create", "post", payload);
};

// 2.4 Update Admin User
export const updateAdminUserApi = (
  userId: string,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    status?: string;
    admin_status?: string;
  }
) => {
  return responseApi(`/admin/users/${userId}`, "patch", payload);
};

// 2.5 Delete Admin User
export const deleteAdminUserApi = (userId: string) => {
  return responseApi(`/admin/users/${userId}`, "delete", {});
};

// 10.1 GET Retailer-Account-Users
export const fetchRetailerAccountsUsersApi = (params?: {
  status?: "active" | "inactive";
  user_status?: "active" | "inactive";
  page?: number;
  per_page?: number;
  include_channel_status?: boolean;
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
  if (params?.include_channel_status != null) {
    queryParams.append("include_channel_status", String(params.include_channel_status));
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
  status?: "pending" | "approved" | "approved_with_edits" | "rejected";
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  const queryString = queryParams.toString();
  const url = `/admin/projection-requests${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

export interface MonthEditPayload {
  projection_month: string;
  approved_projection: number;
}

export interface UpdateProjectionRequestStatusPayload {
  request_id: string;
  status: number; // 1 = Approved, 0 = Rejected, 2 = Approved with edits
  message?: string;
  month_edits?: MonthEditPayload[];
}

// 11.2 Update Monthly Shipment Projection Request Status
export const updateProjectionRequestStatusApi = (
  payload: UpdateProjectionRequestStatusPayload
) => {
  return responseApi("/admin/projection-requests/status", "patch", payload);
};

export interface UpdateChannelPlatformLivePayload {
  channel_id: string;
  platform_live: boolean;
}

// 12.1 Update Channel Platform Live Status
export const updateChannelPlatformLiveStatusApi = (
  payload: UpdateChannelPlatformLivePayload
) => {
  return responseApi("/admin/channels/platform-live", "patch", payload);
};

export type NotificationPriority = "LOW" | "MID" | "HIGH";
export type NotificationCategory = "SYSTEM_ERROR" | "ACTION_REQUIRED" | "INFORMATIONAL" | string;
export type NotificationStatus = "OPEN" | "REVIEWED" | "RESOLVED";

export interface NotificationErrorDetails {
  status_code?: number;
  statusCode?: number;
  smtp_code?: number;
  exception_type?: string;
  source?: string;
  [key: string]: any;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  status: NotificationStatus;
  created_at?: string;
  time?: string;
  action_url?: string | null;
  error_details?: NotificationErrorDetails | null;
  technical_info?: { raw_json?: Record<string, any> } | null;
  type?: string | null;
  is_seen?: boolean;
}

export interface NotificationSummary {
  unread_count: number;
  pending_count?: number;
  total?: number;
  OPEN?: number;
  REVIEWED?: number;
  RESOLVED?: number;
  [key: string]: any;
}

export interface NotificationListResponse {
  notifications?: NotificationItem[];
  items?: NotificationItem[];
  data?: NotificationItem[] | {
    notifications?: NotificationItem[];
    items?: NotificationItem[];
    summary?: NotificationSummary;
    total_pages?: number;
    has_more?: boolean;
    page?: number;
    page_size?: number;
    total?: number;
  };
  summary?: NotificationSummary;
  total_pages?: number;
  has_more?: boolean;
  page?: number;
  page_size?: number;
  total?: number;
}

// 13.1 Get Notifications API
export const fetchNotificationsApi = (params?: {
  page?: number;
  page_size?: number;
  status?: NotificationStatus;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  type?: string;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page != null) {
    queryParams.append("page", String(params.page));
  }
  if (params?.page_size != null) {
    queryParams.append("page_size", String(params.page_size));
  }
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.category) {
    queryParams.append("category", params.category);
  }
  if (params?.priority) {
    queryParams.append("priority", params.priority);
  }
  if (params?.type) {
    queryParams.append("type", params.type);
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  const queryString = queryParams.toString();
  const url = `/admin/notifications${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

// 13.2 Get Notification Details API
export const fetchNotificationDetailsApi = (notificationId: string) => {
  return universalApi(`/admin/notifications/${notificationId}`, "get");
};

// 13.3 Update Notification Status API
export const updateNotificationStatusApi = (
  notificationId: string,
  payload: { status: NotificationStatus }
) => {
  return responseApi(`/admin/notifications/${notificationId}`, "patch", payload);
};

