"use client";

import { AuthHeader, AuthLayout } from "@/components/common";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordField } from "@/components/ui/password-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useApi } from "use-hook-api";
import * as z from "zod";
import { signupApi } from "../../api/auth";

// Define the form schema using Zod
const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupScreen() {
    const [callApi, { loading: isLoading }] = useApi({ both: true, resSuccessMsg: 'Signup Successfully' });
    const router = useRouter();

    const form = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        mode: "onChange"
    });

    const onSubmit = async (payload: SignupFormData) => {
        callApi(signupApi(payload), ({ data }: any) => {
            console.log('Signup successful:', data);
            router.push(`/verify-otp?email=${encodeURIComponent(payload.email)}`);
        });
    };

    const handleLogin = () => {
        router.push("/login");
    };

    return (
        <AuthLayout>
            <AuthHeader title="Create Account" />
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-5">
                {/* First Name & Last Name */}
               
                    <FormField
                        name="name"
                        label="Name"
                        placeholder="Enter Name"
                        form={form}
                        required
                    />
              

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
                    placeholder="Create a secure password"
                    form={form}
                    required
                />

                {/* Confirm Password Field */}
                <PasswordField
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    form={form}
                    required
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        "Creating account..."
                    ) : (
                        <>
                            Signup
                            
                        </>
                    )}
                </Button>
            </form>

            {/* Account Navigation */}
            <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Button
                        variant="link"
                        onClick={handleLogin}
                        className="text-primary hover:text-primary/90 p-0 h-auto text-sm font-medium"
                    >
                        Log In here
                    </Button>
                </p>
            </div>

          
        </AuthLayout>
    );
}
