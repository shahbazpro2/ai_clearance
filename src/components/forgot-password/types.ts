import * as z from "zod";

// Define the forgot password form schema using Zod
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Define the combined OTP verification and password reset schema
export const otpAndPasswordResetSchema = z
  .object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type OtpAndPasswordResetFormData = z.infer<
  typeof otpAndPasswordResetSchema
>;
