import { responseApi } from "use-hook-api";

interface UniversalApiOptions {
  headers?: Record<string, string>;
}

/**
 * Universal API wrapper that works in both client and server environments
 * Automatically detects the environment and uses appropriate token retrieval method
 *
 * @param url - API endpoint URL
 * @param method - HTTP method (get, post, put, delete, etc.)
 * @param options - Optional configuration including custom headers
 * @returns Promise with API response
 */
const universalApiWrapper = async (
  url: string,
  method: string,
  data?: any,
  options?: UniversalApiOptions & { body?: any; token?: string }
) => {
  let token: string | null = null;
  let retailerAccountId: string | null = null;

  // Detect environment and get tokens accordingly
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    token = cookieStore.get("access_token")?.value || null;
    retailerAccountId = cookieStore.get("retailer_view_account_id")?.value || null;
  } else {
    // Client-side: use document.cookie
    const cookies = document.cookie.split(";");
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("access_token=")
    );
    token = accessTokenCookie ? accessTokenCookie.split("=")[1] : null;

    const retailerCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("retailer_view_account_id=")
    );
    retailerAccountId = retailerCookie ? decodeURIComponent(retailerCookie.split("=")[1]) : null;
  }

  // Prepare headers
  const headers: Record<string, string> = {
    ...options?.headers,
  };

  // Add authorization header if token exists
  if (options?.token) {
    headers["Authorization"] = `Bearer ${options?.token}`;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add X-Retailer-Account-Id header for retailer API requests if in retailer-view mode
  if (retailerAccountId) {
    const isRetailerReq =
      url.includes("/retailer") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/retailer"));
    if (isRetailerReq) {
      headers["X-Retailer-Account-Id"] = retailerAccountId;
    }
  }

  // Call responseApi with the prepared headers
  const res = await responseApi(
    `${process.env.NEXT_PUBLIC_API_URL}${url}`,
    method,
    data,
    headers
  )();
  return res;
};

export const universalApi = (
  url: string,
  method: string,
  data?: any,
  options?: UniversalApiOptions & { body?: any; token?: string }
): (() => Promise<any>) => {
  return () => universalApiWrapper(url, method, data, options);
};
