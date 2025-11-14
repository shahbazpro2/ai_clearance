"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Mail } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ForgotPasswordFormData } from "./types";

interface EmailStepProps {
    onSubmit: (data: ForgotPasswordFormData) => void;
    isLoading: boolean;
    form: UseFormReturn<ForgotPasswordFormData>;
}

export function EmailStep({ onSubmit, isLoading, form }: EmailStepProps) {
    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-5">
            <div className="text-center mb-6">
                <p className="text-gray-600">
                    Enter your email address and we&apos;ll send you a verification code to reset your password.
                </p>
            </div>

            <FormField
                name="email"
                label="Email Address"
                placeholder="john@example.com"
                type="email"
                form={form}
                required
            />

            <Button
                type="submit"
                className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90"
                disabled={isLoading}
            >
                {isLoading ? (
                    "Sending..."
                ) : (
                    <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Reset Code
                    </>
                )}
            </Button>
        </form>
    );
}
