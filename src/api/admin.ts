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

// 2.1 Get All Admin Users
export const fetchAdminUsersApi = (params?: {
  status?: "active" | "pending" | "suspended" | "rejected";
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.append("status", params.status);
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

// 6.1 Fetch Manual Availability Requests
export const fetchManualAvailabilityRequestsApi = (params?: {
  status?: "pending" | "reviewed";
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
  const url = `/admin/manual-availability/requests${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

// 6.2 GET Specific Campaign Manual Availability Review Details
export const fetchManualAvailabilityCampaignDetailsApi = (
  campaignId: string,
) => {
  const params = new URLSearchParams({ campaign_id: campaignId });
  return universalApi(
    `/admin/manual-availability/campaign/details?${params.toString()}`,
    "get",
  );
};

// 6.3 Set Manual Availability Review Details
export const submitManualAvailabilityReviewApi = (payload: {
  campaign_id: string;
  request_id: string;
  programs: Record<
    string,
    {
      confirmed_availability: Record<string, number>;
      admin_notes?: string;
      reviewed_media_rate: number;
      isApproved: boolean;
      media_cost: number;
    }
  >;
}) => {
  return responseApi("/admin/manual-availability/review", "post", payload);
};
