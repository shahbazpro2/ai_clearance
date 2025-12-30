"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordField } from "@/components/ui/password-field";
import {
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthHeader, AuthLayout } from "@/components/common";
import { Axios, useApi } from "use-hook-api";
import { loginApi } from "../../api/auth";
import { setAccessToken, setIsActive, setRefreshToken } from "@/lib/auth";
import { VERSION } from "@/constant";

// Define the login form schema using Zod
const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required")
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginScreen() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onChange"
    });

    const [callApi, { loading: isLoading }] = useApi({ both: true, resSuccessMsg: 'Login successful' });

    const onSubmit = async (data: LoginFormData) => {
        callApi(
            loginApi(data),
            async ({ data: responseData }: any) => {
                console.log('Login successful:', responseData);
                // Set authentication tokens using utility functions
                setAccessToken(responseData.access_token);
                setRefreshToken(responseData.refresh_token);
                Axios.defaults.headers.common['Authorization'] = `Bearer ${responseData.access_token}`;

                // User is verified, navigate to intended destination or dashboard
                window.location.href = redirectTo;
            },
            (errorData: any) => {
                // Check if error message indicates email not verified
                const errorMessage = errorData?.message || errorData?.error || errorData?.data?.message || '';

                if (errorMessage.includes('Your email has not been verified yet. Please verify it to continue.') ||
                    errorMessage.includes('email has not been verified') ||
                    errorMessage.includes('not been verified')) {
                    // Redirect to verification page and request OTP resend
                    router.push(`/verify-otp?email=${encodeURIComponent(data.email)}&resend=true`);
                }
                // Other errors will be handled by useApi's default error handling
            }
        );
    };


    const handleSignup = () => {
        router.push("/signup");
    };

    return (
        <AuthLayout>
            <AuthHeader title="Welcome Back" />
            <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-1">Sign in to your Ai Clerance account</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <FormField
                    name="email"
                    label="Email Address"
                    placeholder="john@example.com"
                    type="email"
                    form={form}
                    required
                />

                {/* Password Field */}
                <PasswordField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    form={form}
                    required
                />

                {/* Forgot Password */}
                <div className="text-right">
                    <Button
                        type="button"
                        variant="link"
                        className="text-sm text-primary hover:text-primary/90 p-0 h-auto cursor-pointer"
                        onClick={() => router.push("/forgot-password")}
                    >
                        Forgot Password?
                    </Button>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90 h-11 font-medium"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        "Signing in..."
                    ) : (
                        <>

                            Sign In
                        </>
                    )}
                </Button>
            </form>

            {/* Account Navigation */}
            <div className="text-center pt-4">
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
        </AuthLayout>
    );
}
