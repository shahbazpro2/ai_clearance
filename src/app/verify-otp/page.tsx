

import { OtpVerificationScreen } from "@/components/OtpVerificationScreen";

export default async function VerifyOtpPage({ searchParams }: { searchParams: Promise<{ email: string; resend?: string }> }) {
    const params = await searchParams;
    const email = params.email;
    const shouldResend = params.resend === 'true';

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Request</h1>
                    <p className="text-gray-600">Email parameter is missing. Please try signing up again.</p>
                </div>
            </div>
        );
    }

    return <OtpVerificationScreen email={email} shouldResendOtp={shouldResend} />;
}
