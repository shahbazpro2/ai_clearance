"use client";

import { AuthHeader, AuthLayout } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Axios, useApi } from "use-hook-api";
import * as z from "zod";
import { verifySignupOtpApi } from "../../api/auth";
import { setAccessToken, setRefreshToken } from "@/lib/auth";

// Define the OTP form schema using Zod
const otpSchema = z.object({
    otp: z.string()
        .min(6, "OTP must be 6 digits")
        .max(6, "OTP must be 6 digits")
        .regex(/^\d{6}$/, "OTP must contain only numbers")
});

type OtpFormData = z.infer<typeof otpSchema>;

interface OtpVerificationScreenProps {
    email: string;
    onBack?: () => void;
}

export function OtpVerificationScreen({ email, onBack }: OtpVerificationScreenProps) {
    const [callApi, { loading: isLoading }] = useApi({ both: true, resSuccessMsg: 'OTP verified successfully' });
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const form = useForm<OtpFormData>({
        resolver: zodResolver(otpSchema),
        mode: "onChange"
    });

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length === 1 && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Update form value
        const currentOtp = form.getValues("otp") || "";
        const newOtp = currentOtp.slice(0, index) + value + currentOtp.slice(index + 1);
        form.setValue("otp", newOtp);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text");
        const digits = pastedData.replace(/\D/g, "").slice(0, 6); // Extract only digits, limit to 6

        if (digits.length > 0) {
            // Clear all inputs first
            inputRefs.current.forEach((ref) => {
                if (ref) ref.value = "";
            });

            // Fill inputs with pasted digits
            digits.split("").forEach((digit, idx) => {
                if (idx < 6 && inputRefs.current[idx]) {
                    inputRefs.current[idx]!.value = digit;
                }
            });

            // Update form value with complete OTP
            form.setValue("otp", digits);

            // Focus the next empty input or the last one
            const nextIndex = Math.min(digits.length, 5);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            // Call resend OTP API
            await callApi(verifySignupOtpApi({ email }), () => {
                setTimeLeft(300);
                setCanResend(false);
            });
        } catch (error) {
            console.error("Failed to resend OTP:", error);
        } finally {
            setIsResending(false);
        }
    };

    const onSubmit = async (data: OtpFormData) => {
        callApi(verifySignupOtpApi({ email, otp: data.otp }), ({data}: any) => {
            if(data?.access_token){
                setAccessToken(data.access_token);
                setRefreshToken(data.refresh_token);
                Axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
            }else
            router.push("/login");
        });
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <AuthLayout>
            <AuthHeader title="Verify Your Email" />

            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={handleBack}
                className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <div className="text-center space-y-4 mt-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                    <p className="text-gray-600">
                        We&apos;ve sent a verification code to
                    </p>
                    <p className="text-blue-600 font-medium">{email}</p>
                </div>

                {/* OTP Input Fields */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">
                            Enter the 6-digit code
                        </Label>

                        <div className="flex justify-center space-x-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    maxLength={1}
                                    className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-blue-500"
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    onFocus={(e) => e.target.select()}
                                />
                            ))}
                        </div>

                        {form.formState.errors.otp && (
                            <div className="flex items-center justify-center text-sm text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {form.formState.errors.otp.message}
                            </div>
                        )}
                    </div>

                    {/* Timer and Resend */}
                    {/*    <div className="space-y-4">
                        {!canResend ? (
                            <div className="flex items-center justify-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-2" />
                                Resend code in {formatTime(timeLeft)}
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="link"
                                onClick={handleResendOtp}
                                disabled={isResending}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                {isResending ? "Sending..." : "Resend code"}
                            </Button>
                        )}
                    </div> */}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90"
                        disabled={isLoading || !form.getValues("otp") || form.getValues("otp")?.length !== 6}
                    >
                        {isLoading ? (
                            "Verifying..."
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verify Email
                            </>
                        )}
                    </Button>
                </form>

                {/* Help Text */}
                <div className="text-center pt-4">
                    <p className="text-sm text-gray-500">
                        Didn&apos;t receive the email? Check your spam folder or{" "}
                        <Button
                            variant="link"
                            onClick={handleResendOtp}
                            disabled={!canResend || isResending}
                            className="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm"
                        >
                            try a different email address
                        </Button>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
