import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

export type MediaBuyerUserStatus = "active" | "pending" | "inactive";

export interface MediaBuyerUser {
  id: string;
  name?: string;
  email: string;
  role?: string;
  user_status?: MediaBuyerUserStatus;
  status?: MediaBuyerUserStatus;
  is_verified?: boolean;
  salesforce_contact_id?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// 2.1 Get All Media Buyer Users
export const fetchMediaBuyerUsersApi = (params?: {
  status?: MediaBuyerUserStatus;
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
  const url = `/media-buyer/users${queryString ? `?${queryString}` : ""}`;
  return universalApi(url, "get");
};

// 2.2 Create a Media Buyer User
export const createMediaBuyerUserApi = (payload: {
  name: string;
  email: string;
  password?: string;
}) => {
  return responseApi("/media-buyer/users/create", "post", payload);
};

// 2.3 Update a Media Buyer User
export const updateMediaBuyerUserApi = (
  userId: string,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    status?: "active" | "inactive";
  }
) => {
  return responseApi(`/media-buyer/users/${userId}`, "patch", payload);
};

// 2.4 Delete a Media Buyer User
export const deleteMediaBuyerUserApi = (userId: string) => {
  return responseApi(`/media-buyer/users/${userId}`, "delete", {});
};

// 3.1 Submit Brand Websites
export const submitBrandWebsitesApi = (payload: { websites: string[] }) => {
  return responseApi("/media-buyer/brands", "post", payload);
};

// 3.2 Get Submitted Brands
export const fetchSubmittedBrandsApi = () => {
  return universalApi("/media-buyer/brands", "get");
};

// 3.3 Delete Brand Submission
export const deleteBrandSubmissionApi = (brandSubmissionId: string) => {
  return responseApi(`/media-buyer/brands/${brandSubmissionId}`, "delete", {});
};
