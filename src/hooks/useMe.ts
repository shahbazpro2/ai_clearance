/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { useApi } from "use-hook-api";
import { meApi } from "../../api/auth";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { clearAuthTokens } from "@/lib/auth";

export const useMe = () => {
  const [callApi, { data }] = useApi({ cache: "meUser", errMsg: false });
  const pathname = usePathname();

  useEffect(() => {
    if (data || ROUTES.AUTH.includes(pathname as any)) return;
    callApi(meApi(), null, (errorData: any) => {
      console.log("🔑 errorData:", errorData);
      if (errorData?.status === 401) {
        clearAuthTokens();
        window.location.href = "/login";
      }
    });
  }, []);

  return data;
};
