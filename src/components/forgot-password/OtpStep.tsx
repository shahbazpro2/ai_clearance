"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { CheckCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { OtpAndPasswordResetFormData } from "./types";

interface OtpStepProps {
    onSubmit: (data: OtpAndPasswordResetFormData) => void;
    isLoading: boolean;
    form: UseFormReturn<OtpAndPasswordResetFormData>;
    email: string;
    onResend: () => void;
}

export function OtpStep({ onSubmit, isLoading, form, email, onResend }: OtpStepProps) {
    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-5">
            <div className="text-center mb-6">
                <p className="text-gray-600">
                    We&apos;ve sent a 6-digit verification code to{" "}
                    <span className="font-medium">{email}</span>
                </p>
                <p className="text-gray-600 mt-2">
                    Enter the code and your new password below.
                </p>
            </div>

            <FormField
                name="otp"
                label="Verification Code"
                placeholder="123456"
                type="text"
                form={form}
                required
                maxLength={6}
            />

            <FormField
                name="password"
                label="New Password"
                placeholder="Enter new password"
                type="password"
                form={form}
                required
            />

            <FormField
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Confirm new password"
                type="password"
                form={form}
                required
            />

            <Button
                type="submit"
                className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90"
                disabled={isLoading}
            >
                {isLoading ? (
                    "Verifying & Resetting Password..."
                ) : (
                    <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Code & Reset Password
                    </>
                )}
            </Button>

            <div className="text-center">
                <Button
                    type="button"
                    variant="link"
                    onClick={onResend}
                    className="text-sm text-primary hover:text-primary/90 p-0 h-auto cursor-pointer"
                >
                    Didn&apos;t receive the code? Resend
                </Button>
            </div>
        </form>
    );
}
