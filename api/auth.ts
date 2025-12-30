import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const signupApi = (payload: any) => {
  return responseApi("/auth/signup", "post", payload);
};

export const verifySignupOtpApi = (payload: any) => {
  return responseApi("/auth/verify-otp", "post", payload);
};

export const resendOtpApi = (payload: { email: string }) => {
  return responseApi("/auth/resend-otp", "post", payload);
};

export const loginApi = (payload: any) => {
  return responseApi("/auth/login", "post", payload);
};

export const resetPasswordApi = (payload: {
  email: string;
  otp: string;
  new_password: string;
}) => {
  return responseApi("/auth/reset-password", "post", payload);
};

export const forgotPasswordApi = (payload: { email: string }) => {
  return responseApi("/auth/forgot-password", "post", payload);
};

export const verifyOtpApi = (payload: {
  email: string;
  otp: string;
  new_password: string;
}) => {
  return responseApi(`/auth/reset-password`, "post", payload);
};

export const refreshTokenApi = (payload: any) => {
  return responseApi("/auth/token", "post", payload);
};

export const meApi = () => {
  return universalApi(`/auth/me`, "get");
};

export const deleteAccountApi = () => {
  return universalApi(`/delete_user`, "delete");
};
