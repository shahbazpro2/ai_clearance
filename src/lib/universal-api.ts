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
  // Detect environment and get token accordingly
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    token = cookieStore.get("access_token")?.value || null;
  } else {
    // Client-side: use document.cookie
    const cookies = document.cookie.split(";");
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("access_token=")
    );
    token = accessTokenCookie ? accessTokenCookie.split("=")[1] : null;
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
