import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

// 5.1 Home Page Details
export const fetchHomePageDetailsApi = () => {
  return universalApi("/admin/home-page/details", "get");
};

// 3.1 Get Manual Review Records
export const fetchManualReviewsApi = (params?: {
  is_challenged?: boolean;
  status?: string;
}) => {
  // Construct query string manually if needed, or rely on universalApi/responseApi if they handle params object.
  // universalApi wrapper passes data as 3rd arg, which for GET requests usually means query params in some libs,
  // but let's check how universalApi handles it.
  // Looking at universalApi implementation:
  // const res = await responseApi(`${process.env.NEXT_PUBLIC_API_URL}${url}`, method, data, headers)();
  // use-hook-api's responseApi typically takes (url, method, data, headers).
  // For GET, data usually is ignored or appended as query.
  // Let's assume we need to append query params to URL or pass as data if the lib supports it.
  // Safest is to append to URL for now given I haven't seen the lib internals fully.

  const queryParams = new URLSearchParams();
  if (params?.is_challenged !== undefined) {
    queryParams.append("is_challenged", String(params.is_challenged));
  }
  if (params?.status) {
    queryParams.append("status", params.status);
  }

  const queryString = queryParams.toString();
  const url = `/admin/manual-reviews${queryString ? `?${queryString}` : ""}`;

  return universalApi(url, "get");
};

// 4.1 View GCP File
export const viewGcpFileApi = (payload: { view_gcp_file: string }) => {
  return responseApi("/admin/view-gcp-file", "post", payload);
};

// 3.2 Submit Manual Review
export const submitManualReviewApi = (payload: {
  campaign_id: string;
  category_id?: string;
  feedback?: string;
  is_approved: boolean;
}) => {
  return responseApi("/admin/manual-reviews/set", "post", payload);
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
  if (params?.page != null) queryParams.append("page", String(params.page));
  if (params?.page_size != null) queryParams.append("page_size", String(params.page_size));
  if (params?.status) queryParams.append("status", params.status);
  if (params?.category) queryParams.append("category", params.category);
  if (params?.priority) queryParams.append("priority", params.priority);
  if (params?.type) queryParams.append("type", params.type);
  if (params?.search) queryParams.append("search", params.search);
  const queryString = queryParams.toString();
  const url = `/admin/notifications${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

export const fetchNotificationDetailsApi = (notificationId: string) => {
  return universalApi(`/admin/notifications/${notificationId}`, "get");
};

export const updateNotificationStatusApi = (
  notificationId: string,
  payload: { status: NotificationStatus }
) => {
  return responseApi(`/admin/notifications/${notificationId}`, "patch", payload);
};

