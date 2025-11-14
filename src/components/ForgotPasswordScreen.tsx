"use client";

import { AuthHeader, AuthLayout } from "@/components/common";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Axios, useApi } from "use-hook-api";
import { forgotPasswordApi, resetPasswordApi, verifyOtpApi } from "../../api/auth";
import {
    EmailStep,
    OtpStep,
    SuccessStep,
    BackButton,
    forgotPasswordSchema,
    otpAndPasswordResetSchema,
    type ForgotPasswordFormData,
    type OtpAndPasswordResetFormData,
} from "./forgot-password";

export function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "otp" | "success">("email");
    const [email, setEmail] = useState("");

    const forgotPasswordForm = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onChange"
    });

    const otpAndPasswordForm = useForm<OtpAndPasswordResetFormData>({
        resolver: zodResolver(otpAndPasswordResetSchema),
        mode: "onChange"
    });

    const [callForgotPasswordApi, { loading: isForgotPasswordLoading }] = useApi({
        both: true,
        resSuccessMsg: 'Reset code sent to your email'
    });

    const [callResetPasswordApi, { loading: isResetPasswordLoading }] = useApi({
        both: true,
        resSuccessMsg: 'Password reset successfully'
    });

    const onSubmitEmail = async (data: ForgotPasswordFormData) => {
        setEmail(data.email);
        callForgotPasswordApi(forgotPasswordApi(data), () => {
            setStep("otp");
        });
    };

    const onSubmitOtpAndPassword = async (data: OtpAndPasswordResetFormData) => {
        // Call single API that handles both OTP verification and password reset
        callResetPasswordApi(verifyOtpApi({
            email,
            otp: data.otp,
            new_password: data.password
        }), () => {
            setStep("success");
            router.push("/login");
        });
    };

    const handleBackToLogin = () => {
        router.push("/login");
    };

    const handleResendOtp = () => {
        callForgotPasswordApi(forgotPasswordApi({ email }), () => {
            // OTP resent successfully
        });
    };

    const renderStep = () => {
        switch (step) {
            case "email":
                return (
                    <EmailStep
                        onSubmit={onSubmitEmail}
                        isLoading={isForgotPasswordLoading}
                        form={forgotPasswordForm}
                    />
                );
            case "otp":
                return (
                    <OtpStep
                        onSubmit={onSubmitOtpAndPassword}
                        isLoading={isResetPasswordLoading}
                        form={otpAndPasswordForm}
                        email={email}
                        onResend={handleResendOtp}
                    />
                );
            case "success":
                return <SuccessStep onBackToLogin={handleBackToLogin} />;
            default:
                return null;
        }
    };

    if (step === "success") {
        return (
            <AuthLayout>
                <AuthHeader title="Password Reset" />
                {renderStep()}
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <AuthHeader title="Forgot Password" />
            <BackButton onClick={handleBackToLogin} />
            {renderStep()}
        </AuthLayout>
    );
}
