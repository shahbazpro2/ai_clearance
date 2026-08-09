"use client";

import { AuthHeader, AuthLayout } from "@/components/common";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordField } from "@/components/ui/password-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useApi } from "use-hook-api";
import * as z from "zod";
import { forgotPasswordApi, verifyOtpApi } from "@/api/auth";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const emailSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

const otpPasswordSchema = z
    .object({
        otp: z
            .string()
            .min(6, "OTP must be 6 digits")
            .max(6, "OTP must be 6 digits")
            .regex(/^\d{6}$/, "OTP must contain only numbers"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type EmailFormData = z.infer<typeof emailSchema>;
type OtpPasswordFormData = z.infer<typeof otpPasswordSchema>;

// ─── OTP input ────────────────────────────────────────────────────────────────

function OtpInput({
    value,
    onChange,
    error,
}: {
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, char: string) => {
        const digit = char.replace(/\D/g, "").slice(-1);
        const arr = (value || "      ").split("");
        arr[index] = digit || " ";
        const next = arr.join("").trimEnd();
        onChange(next.padEnd(6, " ").slice(0, 6).replace(/ /g, ""));
        if (digit && index < 5) refs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!digits.length) return;
        onChange(digits.padEnd(6, " ").slice(0, 6).trimEnd());
        refs.current.forEach((r, i) => {
            if (r) r.value = digits[i] || "";
        });
        refs.current[Math.min(digits.length, 5)]?.focus();
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Input
                        key={i}
                        ref={(el) => { refs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        defaultValue={value[i] || ""}
                        className="w-11 h-11 text-center text-lg font-semibold border-2 focus:border-primary"
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        onFocus={(e) => e.target.select()}
                    />
                ))}
            </div>
            {error && (
                <div className="flex items-center justify-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InventoryForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "otp" | "success">("email");
    const [email, setEmail] = useState("");
    const [otpValue, setOtpValue] = useState("");
    const [timeLeft, setTimeLeft] = useState(300);
    const [canResend, setCanResend] = useState(false);

    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
        mode: "onChange",
    });

    const otpPasswordForm = useForm<OtpPasswordFormData>({
        resolver: zodResolver(otpPasswordSchema),
        mode: "onChange",
    });

    const [callForgotPassword, { loading: forgotLoading }] = useApi({
        both: true,
        resSuccessMsg: "Reset code sent to your email",
    });

    const [callResetPassword, { loading: resetLoading }] = useApi({
        both: true,
        resSuccessMsg: "Password reset successfully",
    });

    // Countdown timer
    useEffect(() => {
        if (step !== "otp") return;
        if (timeLeft <= 0) { setCanResend(true); return; }
        const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, step]);

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const sendResetEmail = (emailAddress: string) => {
        callForgotPassword(
            forgotPasswordApi({ email: emailAddress, role: "inventory" }),
            () => {
                setStep("otp");
                setTimeLeft(300);
                setCanResend(false);
            },
        );
    };

    const onSubmitEmail = (data: EmailFormData) => {
        setEmail(data.email);
        sendResetEmail(data.email);
    };

    const onSubmitOtpPassword = (data: OtpPasswordFormData) => {
        callResetPassword(
            verifyOtpApi({
                email,
                otp: data.otp,
                new_password: data.password,
                role: "inventory",
            }),
            () => {
                setStep("success");
            },
        );
    };

    // Keep OTP form value in sync with the controlled OTP input
    useEffect(() => {
        otpPasswordForm.setValue("otp", otpValue, { shouldValidate: !!otpValue });
    }, [otpValue, otpPasswordForm]);

    // ── Email step ──
    if (step === "email") {
        return (
            <AuthLayout>
                <AuthHeader title="Forgot Password" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 -mt-2 mb-2 px-0"
                    onClick={() => router.push("/login?role=inventory")}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
                </Button>
                <p className="text-sm text-gray-500 mb-4">
                    Enter your email address and we will send you a reset code.
                </p>
                <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
                    <FormField
                        name="email"
                        label="Email Address"
                        placeholder="you@example.com"
                        type="email"
                        form={emailForm}
                        required
                    />
                    <Button
                        type="submit"
                        className="w-full bg-blue-gradient text-white h-11 font-medium"
                        disabled={forgotLoading}
                    >
                        {forgotLoading ? "Sending..." : "Send Reset Code"}
                    </Button>
                </form>
            </AuthLayout>
        );
    }

    // ── OTP + new password step ──
    if (step === "otp") {
        return (
            <AuthLayout>
                <AuthHeader title="Reset Password" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 -mt-2 mb-2 px-0"
                    onClick={() => setStep("email")}
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <p className="text-sm text-gray-500 mb-4">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-gray-800">{email}</span> and choose
                    a new password.
                </p>
                <form
                    onSubmit={otpPasswordForm.handleSubmit(onSubmitOtpPassword)}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Verification Code</Label>
                        <OtpInput
                            value={otpValue}
                            onChange={setOtpValue}
                            error={otpPasswordForm.formState.errors.otp?.message}
                        />
                    </div>

                    <PasswordField
                        name="password"
                        label="New Password"
                        placeholder="Min. 8 characters"
                        form={otpPasswordForm}
                        required
                    />

                    <PasswordField
                        name="confirmPassword"
                        label="Confirm New Password"
                        placeholder="Re-enter your password"
                        form={otpPasswordForm}
                        required
                    />

                    {/* Resend timer */}
                    <div className="text-center text-sm">
                        {!canResend ? (
                            <span className="text-gray-400 flex items-center justify-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Resend code in {formatTime(timeLeft)}
                            </span>
                        ) : (
                            <Button
                                type="button"
                                variant="link"
                                className="text-primary p-0 h-auto text-sm"
                                disabled={forgotLoading}
                                onClick={() => sendResetEmail(email)}
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                Resend code
                            </Button>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-gradient text-white h-11 font-medium"
                        disabled={resetLoading || otpValue.length < 6}
                    >
                        {resetLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>
            </AuthLayout>
        );
    }

    // ── Success step ──
    return (
        <AuthLayout>
            <AuthHeader title="Password Reset" />
            <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                    <CheckCircle className="h-14 w-14 text-green-500" />
                </div>
                <p className="text-gray-600 text-sm">
                    Your password has been reset successfully. You can now sign in with
                    your new password.
                </p>
                <Button
                    className="w-full bg-blue-gradient text-white h-11 font-medium"
                    onClick={() => router.push("/login?role=inventory")}
                >
                    Back to Login
                </Button>
            </div>
        </AuthLayout>
    );
}
