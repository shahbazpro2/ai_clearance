"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordField } from "@/components/ui/password-field";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthHeader, AuthLayout } from "@/components/common";
import { Axios, useApi } from "use-hook-api";
import { loginApi } from "@/api/auth";
import { setAccessToken, setAuthRole, setRefreshToken } from "@/lib/auth";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function InventoryLoginScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
    });

    const [callApi, { loading: isLoading }] = useApi({
        both: true,
        resSuccessMsg: "Login successful",
    });

    const onSubmit = (data: LoginFormData) => {
        callApi(
            loginApi({ ...data, role: "inventory" }),
            ({ data: responseData }: any) => {
                setAccessToken(responseData.access_token);
                setRefreshToken(responseData.refresh_token);
                setAuthRole("inventory");
                Axios.defaults.headers.common["Authorization"] =
                    `Bearer ${responseData.access_token}`;

                const redirect = searchParams.get("redirect");
                window.location.href = redirect || "/inventory-portal";
            },
        );
    };

    return (
        <AuthLayout>
            <div className="min-h-[420px] flex flex-col">
                <div>
                    <AuthHeader title="Inventory Portal" />
                    <p className="text-sm text-center text-gray-500 mb-6 -mt-2">
                        Sign in to manage your distribution center inventory
                    </p>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            name="email"
                            label="Email Address"
                            placeholder="you@example.com"
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
                                onClick={() =>
                                    router.push("/inventory-portal/forgot-password")
                                }
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
            </div>
        </AuthLayout>
    );
}
