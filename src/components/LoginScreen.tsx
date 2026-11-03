"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordField } from "@/components/ui/password-field";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthHeader, AuthLayout } from "@/components/common";
import { Axios, useApi } from "use-hook-api";
import { loginApi } from "@/api/auth";
import { clearAuthTokens, setAccessToken, setAuthRole, setRefreshToken } from "@/lib/auth";
import { universalApi } from "@/lib/universal-api";
import { toast } from "react-toastify";

// Define the login form schema using Zod
const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

export type AuthRole = "admin" | "retailer" | "setup_user" | "finance" | "inventory" | "media_buyer_admin" | "media_buyer_standard";

interface LoginScreenProps {
    role?: AuthRole;
    defaultRole?: AuthRole;
    defaultRedirectTo?: string;
    showSignup?: boolean;
    title?: string;
    subtitle?: string;
    signupPath?: string;
    forgotPasswordPath?: string;
}

export function LoginScreen({
    role: fixedRole,
    defaultRole = "retailer",
    defaultRedirectTo,
    showSignup,
    title,
    subtitle,
    signupPath,
    forgotPasswordPath,
}: LoginScreenProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleFromQuery = (searchParams.get("role") as AuthRole | null) ?? null;
    const [role, setRole] = useState<AuthRole>(fixedRole ?? roleFromQuery ?? defaultRole);

    useEffect(() => {
        if (fixedRole) {
            setRole(fixedRole);
            return;
        }
        if (!roleFromQuery) return;
        if (roleFromQuery === role) return;
        setRole(roleFromQuery);
    }, [fixedRole, roleFromQuery, role]);

    useEffect(() => {
        setAuthRole(role);
    }, [role]);

    const getRedirectPath = (): string => {
        const requestedRedirect = searchParams.get("redirect");
        if (requestedRedirect) return requestedRedirect;
        if (defaultRedirectTo) return defaultRedirectTo;

        if (role === "admin") return "/admin";
        if (role === "media_buyer_admin" || role === "media_buyer_standard") return "/media-buyer/brands";
        if (role === "retailer") return "/retailer/audiences/setup/step";
        if (role === "finance") return "/finance";
        if (role === "inventory") return "/inventory";
        return "/retailer/audiences/setup/step";
    };

    const apiRole = role;

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onChange"
    });

    const [callApi, { loading: isLoading, onClearCaches }] = useApi({
        both: false,
        errMsg: false,
        successMsg: false
    });

    const onSubmit = async (data: LoginFormData) => {
        const payload = apiRole ? { ...data, role: apiRole } : data;

        // A new login must never inherit the previous account's token or cached profile.
        clearAuthTokens();
        onClearCaches(["meUser"]);
        setAuthRole(role);

        callApi(
            loginApi(payload),
            async ({ data: responseData }: any) => {
                setAccessToken(responseData.access_token);
                setRefreshToken(responseData.refresh_token);
                setAuthRole(role);
                Axios.defaults.headers.common['Authorization'] = `Bearer ${responseData.access_token}`;

                // For inventory contacts skip /auth/me and redirect directly
                if (role === "inventory") {
                    const requestedRedirect = searchParams.get("redirect");
                    window.location.href = requestedRedirect || defaultRedirectTo || "/inventory";
                    return;
                }

                // Fetch user data to get actual role for other portals
                try {
                    const meResponse = await universalApi('/auth/me', 'get')();
                    const rawRole = meResponse?.role;
                    const userRole = typeof rawRole === "string" ? rawRole.toLowerCase() : rawRole;

                    const requestedRedirect = searchParams.get("redirect");
                    if (requestedRedirect) {
                        window.location.href = requestedRedirect;
                    } else if (defaultRedirectTo) {
                        window.location.href = defaultRedirectTo;
                    } else if (userRole === 'setup_user' || userRole === 'retailer') {
                        window.location.href = '/retailer/audiences/setup/step';
                    } else if (userRole === 'admin' || userRole === 'super_admin') {
                        window.location.href = '/admin';
                    } else if (userRole === 'media_buyer_admin' || userRole === 'media_buyer_standard') {
                        window.location.href = '/media-buyer/brands';
                    } else if (userRole === 'finance') {
                        window.location.href = '/finance';
                    } else if (userRole === 'inventory') {
                        window.location.href = '/inventory';
                    } else {
                        window.location.href = defaultRedirectTo || getRedirectPath();
                    }
                } catch (error) {
                    console.error('Failed to fetch user data:', error);
                    const redirectPath = getRedirectPath();
                    window.location.href = redirectPath;
                }
            },
            (errorData: any) => {
                const getErrorMessageText = (data: any): string => {
                    if (!data) return "";
                    if (typeof data === "string") return data;
                    if (Array.isArray(data)) return data.map(getErrorMessageText).join(" ");
                    if (typeof data === "object") {
                        const parts = [
                            data.message,
                            data.error,
                            data.data?.message,
                            data.detail,
                        ];
                        return parts.map(getErrorMessageText).filter(Boolean).join(" ");
                    }
                    return String(data);
                };

                const normalizedError = getErrorMessageText(errorData).toLowerCase();

                const isUnverifiedEmail =
                    normalizedError.includes("not been verified") ||
                    normalizedError.includes("not verified") ||
                    normalizedError.includes("verify your email") ||
                    normalizedError.includes("unverified") ||
                    normalizedError.includes("verify it to continue");

                if (isUnverifiedEmail) {
                    const roleQuery = apiRole ? `&role=${encodeURIComponent(apiRole)}` : "";
                    router.push(
                        `/verify-otp?email=${encodeURIComponent(data.email)}&resend=true${roleQuery}`
                    );
                    return;
                }

                // Only show error if have other issue
                if (Array.isArray(errorData?.message)) {
                    errorData.message.forEach((msg: any) => {
                        if (msg) toast.error(String(msg));
                    });
                } else if (typeof errorData?.message === "string" && errorData.message) {
                    toast.error(errorData.message);
                } else if (typeof errorData?.error === "string" && errorData.error) {
                    toast.error(errorData.error);
                } else if (typeof errorData?.data?.message === "string" && errorData.data.message) {
                    toast.error(errorData.data.message);
                } else {
                    toast.error("Invalid credentials or an unexpected error occurred.");
                }
            }
        );
    };

    const handleSignup = () => {
        if (signupPath) {
            router.push(signupPath);
            return;
        }
        const targetSignupPath = role === "admin"
            ? "/admin/signup"
            : role === "retailer"
                ? "/signup?role=retailer"
                : "/signup";
        router.push(targetSignupPath);
    };

    const getForgotPasswordUrl = () => {
        if (forgotPasswordPath) return forgotPasswordPath;
        if (role === "inventory") return "/inventory/forgot-password";
        if (role === "media_buyer_admin" || role === "media_buyer_standard") return "/media-buyer/forgot-password";
        return `/forgot-password${apiRole ? `?role=${encodeURIComponent(apiRole)}` : ""}`;
    };

    const getDefaultTitle = () => {
        if (role === "admin") return "Admin Portal";
        if (role === "media_buyer_admin" || role === "media_buyer_standard") return "Media Buyer Portal";
        if (role === "finance") return "Insert Distributor Finance";
        if (role === "inventory") return "Insert Distributor Inventory";
        if (role === "retailer") return "Insert Distributor";
        return "Welcome Back";
    };

    const getDefaultSubtitle = () => {
        if (role === "admin") return "Sign in to your Admin account";
        if (role === "media_buyer_admin" || role === "media_buyer_standard") return "Sign in to your Media Buyer account";
        if (role === "finance") return "Sign in to Insert Distributor Finance";
        if (role === "inventory") return "Sign in to Insert Distributor Inventory";
        if (role === "retailer") return "Sign in to your Insert Distributor account";
        return "Sign in to your account";
    };

    const resolvedTitle = title || getDefaultTitle();
    const resolvedSubtitle = subtitle !== undefined ? subtitle : getDefaultSubtitle();

    // Roles without signup by default
    const noSignupRoles: AuthRole[] = ["finance", "inventory", "media_buyer_admin", "media_buyer_standard"];
    const shouldDisplaySignup = showSignup !== undefined
        ? showSignup
        : !noSignupRoles.includes(role);

    return (
        <AuthLayout>
            <div className="min-h-[500px] flex flex-col">
                <div>
                    <AuthHeader title={resolvedTitle} />
                    {resolvedSubtitle && (
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-600 mb-1">{resolvedSubtitle}</p>
                        </div>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            name="email"
                            label="Email Address"
                            placeholder="john@example.com"
                            type="email"
                            form={form}
                            required
                        />

                        <PasswordField
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            form={form}
                            required
                        />

                        <div className="text-right">
                            <Button
                                type="button"
                                variant="link"
                                className="text-sm text-primary hover:text-primary/90 p-0 h-auto cursor-pointer"
                                onClick={() => router.push(getForgotPasswordUrl())}
                            >
                                Forgot Password?
                            </Button>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90 h-11 font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </div>

                <div className="mt-auto pt-4">
                    {shouldDisplaySignup ? (
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don&apos;t have an account?{" "}
                                <Button
                                    variant="link"
                                    onClick={handleSignup}
                                    className="text-primary hover:text-primary/90 p-0 h-auto text-sm font-medium cursor-pointer"
                                >
                                    Create an account
                                </Button>
                            </p>
                        </div>
                    ) : (
                        <div className="h-5" />
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}
