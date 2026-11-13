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

export type BrandStatus =
  | "Ready for Campaign Creation"
  | "Pending"
  | "Rejected"
  | string;

export interface BrandSubmission {
  brand_submission_id: string;
  domain: string;
  status: BrandStatus;
  brand_id?: string | null;
  request_id?: string | null;
  admin_message?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

// 3.1 Submit Brand Websites
export const submitBrandWebsitesApi = (payload: { websites: string[] }) => {
  return responseApi("/media-buyer/brands", "post", payload);
};

// 3.2 Get Submitted Brands
export const fetchSubmittedBrandsApi = () => {
  return universalApi("/media-buyer/brands", "get");
};

// 3.3 Edit Pending Brand Submission
export const editPendingBrandSubmissionApi = (
  brandSubmissionId: string,
  payload: { website: string }
) => {
  return responseApi(`/media-buyer/brands/${brandSubmissionId}`, "patch", payload);
};

// 3.4 Delete Brand Submission
export const deleteBrandSubmissionApi = (brandSubmissionId: string) => {
  return responseApi(`/media-buyer/brands/${brandSubmissionId}`, "delete", {});
};

// 4. Insert Version Types & Endpoints

export interface InsertFormat {
  id: string;
  slug: string;
  name: string;
  price_range: string;
  size_and_paper?: string | null;
  carrier?: string | null;
  card?: string | null;
  sample_video_reference?: string | null;
  design_template_reference?: string | null;
  [key: string]: any;
}

export interface InsertVersion {
  id: string;
  version_name: string;
  format: InsertFormat;
  inkjet_enabled: boolean;
  artwork_uploaded: boolean;
  artwork_public_url?: string | null;
  created_at: string;
  updated_at: string;
  inkjet_csv_uploaded?: boolean;
  csv_original_filename?: string | null;
  csv_row_count?: number | null;
  csv_uploaded_at?: string | null;
  [key: string]: any;
}

// 4.1 Get Insert Formats
export const fetchInsertFormatsApi = () => {
  return universalApi("/media-buyer/insert-formats", "get");
};

// 4.2 Create Insert Version
export const createInsertVersionApi = (payload: {
  insert_format_id: string;
  version_name: string;
  inkjet_enabled?: boolean;
}) => {
  return responseApi("/media-buyer/insert-versions", "post", payload);
};

// 4.3 Get Insert Versions
export const fetchInsertVersionsApi = () => {
  return universalApi("/media-buyer/insert-versions", "get");
};

// 4.4 Update Insert Version
export const updateInsertVersionApi = (
  insertVersionId: string,
  payload: {
    version_name?: string;
    inkjet_enabled?: boolean;
  }
) => {
  return responseApi(
    `/media-buyer/insert-versions/${insertVersionId}`,
    "patch",
    payload
  );
};

// 4.5 Upload Insert Artwork
export const uploadInsertArtworkApi = (
  insertVersionId: string,
  formData: FormData
) => {
  return responseApi(
    `/media-buyer/insert-versions/${insertVersionId}/artwork`,
    "post",
    formData
  );
};

// 4.6 Upload Inkjet CSV
export const uploadInkjetCsvApi = (
  insertVersionId: string,
  formData: FormData
) => {
  return responseApi(
    `/media-buyer/insert-versions/${insertVersionId}/inkjet-csv`,
    "post",
    formData
  );
};

// 5. Campaign Types & Endpoints

export interface EligibleBrand {
  brand_id: string;
  name: string;
  domain: string;
  [key: string]: any;
}

export interface CampaignRecord {
  id: string;
  name: string;
  brand_id: string;
  brand_name?: string;
  brand_domain?: string;
  status?: string;
  selected_programs?: string[];
  step?: number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface CampaignProgram {
  channel_id: string;
  channel_name?: string;
  salesforce_channel_id?: string;
  audience_name: string;
  program_type: "Instant" | "Manual" | string;
  attribution_distinction: string;
  media_cpm: number;
  category: string;
  website: string;
  annual_reach: number;
  female_percentage: number;
  male_percentage: number;
  avg_order_value: number;
  [key: string]: any;
}

// 5.1 Get Eligible Campaign Brands
export const fetchEligibleBrandsApi = () => {
  return universalApi("/media-buyer/campaigns/eligible-brands", "get");
};

// 5.2 Create Campaign
export const createCampaignApi = (payload: { brand_id: string; name: string }) => {
  return responseApi("/media-buyer/campaigns/create", "post", payload);
};

// 5.3 List User Campaigns
export const fetchUserCampaignsApi = (params?: { page?: number; per_page?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.page != null) queryParams.append("page", String(params.page));
  if (params?.per_page != null) queryParams.append("per_page", String(params.per_page));
  const queryString = queryParams.toString();
  return universalApi(`/media-buyer/campaigns/list${queryString ? `?${queryString}` : ""}`, "get");
};

// 5.4 Get Campaign Programs
export interface FetchCampaignProgramsParams {
  campaign_id: string;
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  instant_only?: boolean;
  attribution_enabled?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const fetchCampaignProgramsApi = (params: FetchCampaignProgramsParams) => {
  const queryParams = new URLSearchParams();
  if (params.page != null) queryParams.append("page", String(params.page));
  if (params.per_page != null) queryParams.append("per_page", String(params.per_page));
  if (params.search?.trim()) queryParams.append("search", params.search.trim());
  if (params.category && params.category !== "ALL") queryParams.append("category", params.category);
  if (params.instant_only) queryParams.append("instant_only", "true");
  if (params.attribution_enabled) queryParams.append("attribution_enabled", "true");
  if (params.sort_by) queryParams.append("sort_by", params.sort_by);
  if (params.sort_order) queryParams.append("sort_order", params.sort_order);
  const queryString = queryParams.toString();
  return universalApi(
    `/media-buyer/campaigns/${encodeURIComponent(params.campaign_id)}/programs${
      queryString ? `?${queryString}` : ""
    }`,
    "get"
  );
};

// 5.5 Save Campaign Programs Selection
export const saveCampaignProgramsSelectionApi = (
  campaign_id: string,
  payload: { channel_ids: string[] }
) => {
  return responseApi(
    `/media-buyer/campaigns/${encodeURIComponent(campaign_id)}/programs/selection`,
    "put",
    payload
  );
};
