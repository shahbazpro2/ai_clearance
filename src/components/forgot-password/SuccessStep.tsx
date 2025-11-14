"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface SuccessStepProps {
    onBackToLogin: () => void;
}

export function SuccessStep({ onBackToLogin }: SuccessStepProps) {
    return (
        <div className="text-center space-y-6 mt-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">Password Reset Successful!</h2>
                <p className="text-gray-600">
                    Your password has been reset successfully. You can now log in with your new password.
                </p>
            </div>

            <Button
                onClick={onBackToLogin}
                className="w-full bg-blue-gradient text-white hover:bg-blue-gradient/90"
            >
                Back to Login
            </Button>
        </div>
    );
}
