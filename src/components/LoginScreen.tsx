"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordField } from "@/components/ui/password-field";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthHeader, AuthLayout } from "@/components/common";
import { Axios, useApi } from "use-hook-api";
import { loginApi } from "@/api/auth";
import { setAccessToken, setAuthRole, setIsActive, setRefreshToken } from "@/lib/auth";
import { universalApi } from "@/lib/universal-api";
import { VERSION } from "@/constant";

// Define the login form schema using Zod
const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

type AuthRole = "user" | "admin" | "retailer" | "setup_user" | "finance" | "inventory";

export function LoginScreen({
    defaultRole = "user",
    defaultRedirectTo,
    showSignup = true,
    title,
}: {
    defaultRole?: AuthRole;
    defaultRedirectTo?: string;
    showSignup?: boolean;
    title?: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleFromQuery = (searchParams.get("role") as AuthRole | null) ?? null;
    const [role, setRole] = useState<AuthRole>(roleFromQuery ?? defaultRole);

    useEffect(() => {
        if (!roleFromQuery) return;
        if (roleFromQuery === role) return;
        setRole(roleFromQuery);
    }, [roleFromQuery, role]);

    useEffect(() => {
        setAuthRole(role);
    }, [role]);

    const getRedirectPath = (): string => {
        const requestedRedirect = searchParams.get("redirect");
        if (requestedRedirect) return requestedRedirect;
        if (defaultRedirectTo) return defaultRedirectTo;

        if (role === "admin") return "/admin";
        if (role === "retailer") return "/retailer";
        if (role === "finance") return "/finance";
        if (role === "inventory") return "/inventory-portal";
        return "/";
    };

    // role sent to the login API (undefined for plain "user")
    const apiRole = role === "user" ? undefined : role;

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onChange"
    });

    const [callApi, { loading: isLoading }] = useApi({ both: true, resSuccessMsg: 'Login successful' });

    const onSubmit = async (data: LoginFormData) => {
        const payload = apiRole ? { ...data, role: apiRole } : data;
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
                    window.location.href = requestedRedirect || "/inventory-portal";
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
                    } else if (userRole === 'setup_user') {
                        window.location.href = '/retailer/audiences/setup/step';
                    } else if (userRole === 'retailer') {
                        window.location.href = '/retailer/block-categories';
                    } else if (userRole === 'admin' || userRole === 'super_admin') {
                        window.location.href = '/admin';
                    } else if (userRole === 'finance') {
                        window.location.href = '/finance';
                    } else if (userRole === 'inventory') {
                        window.location.href = '/inventory-portal';
                    } else {
                        window.location.href = '/';
                    }
                } catch (error) {
                    console.error('Failed to fetch user data:', error);
                    const redirectPath = getRedirectPath();
                    window.location.href = redirectPath;
                }
            },
            (errorData: any) => {
                const errorMessage = errorData?.message || errorData?.error || errorData?.data?.message || '';

                if (
                    errorMessage.includes('Your email has not been verified yet. Please verify it to continue.') ||
                    errorMessage.includes('email has not been verified') ||
                    errorMessage.includes('not been verified')
                ) {
                    const roleQuery = apiRole ? `&role=${encodeURIComponent(apiRole)}` : "";
                    router.push(
                        `/verify-otp?email=${encodeURIComponent(data.email)}&resend=true${roleQuery}`
                    );
                }
            }
        );
    };

    const handleSignup = () => {
        const targetSignupPath = role === "admin"
            ? "/admin/signup"
            : role === "retailer"
                ? "/signup?role=retailer"
                : "/signup";
        router.push(targetSignupPath);
    };

    const getForgotPasswordPath = () => {
        if (role === "inventory") return "/inventory-portal/forgot-password";
        return `/forgot-password${apiRole ? `?role=${encodeURIComponent(apiRole)}` : ""}`;
    };

    const tabs: { label: string; value: AuthRole }[] = [
        { label: "Admin",     value: "admin" },
        { label: "Advertiser",value: "user" },
        { label: "Retailer",  value: "retailer" },
        { label: "Finance",   value: "finance" },
        { label: "Inventory", value: "inventory" },
    ];

    const noSignupRoles: AuthRole[] = ["retailer", "finance", "inventory"];

    return (
        <AuthLayout>
            <div className="min-h-[560px] flex flex-col">
                <div>
                    <AuthHeader title={title || "Welcome Back"} />
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-600 mb-1">Sign in to your Ai Clearance account</p>
                        <div className="mt-3 grid grid-cols-5 rounded-lg bg-gray-100 p-1 gap-0.5">
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.value}
                                    type="button"
                                    size="sm"
                                    variant={role === tab.value ? "default" : "ghost"}
                                    className="w-full text-xs px-1"
                                    onClick={() => {
                                        setRole(tab.value);
                                        const next = new URLSearchParams(searchParams.toString());
                                        next.set("role", tab.value);
                                        router.replace(`/login?${next.toString()}`);
                                    }}
                                >
                                    {tab.label}
                                </Button>
                            ))}
                        </div>
                    </div>

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
                                onClick={() => router.push(getForgotPasswordPath())}
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
                    {showSignup && !noSignupRoles.includes(role) ? (
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
