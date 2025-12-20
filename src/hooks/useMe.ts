import { useEffect, useRef } from "react";
import { useApi } from "use-hook-api";
import { meApi } from "../../api/auth";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { clearAuthTokens } from "@/lib/auth";

// Global flag to track if API call has been initiated (shared across all hook instances)
let apiCallInitiated = false;

export const useMe = () => {
  const [callApi, { data }] = useApi({ cache: "meUser", errMsg: false });
  const pathname = usePathname();
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // Skip if data already exists (from cache - this means data is available)
    if (data) {
      hasCalledRef.current = true;
      apiCallInitiated = false; // Reset global flag when data is available
      return;
    }

    // Skip if already called in this component instance
    if (hasCalledRef.current) return;

    // Skip if on auth routes
    if (ROUTES.AUTH.includes(pathname as any)) {
      hasCalledRef.current = true;
      return;
    }

    // Skip if API call has been initiated globally (by another component instance)
    if (apiCallInitiated) return;

    // Mark as initiated globally and locally
    apiCallInitiated = true;
    hasCalledRef.current = true;

    callApi(meApi(), null, (errorData: any) => {
      console.log("🔑 errorData:", errorData);
      if (errorData?.status === 401) {
        clearAuthTokens();
        window.location.href = "/login";
      }
      // Reset global flag on error so it can be retried
      apiCallInitiated = false;
    });
  }, [data, pathname, callApi]);

  return data;
};
