import { LoginScreen } from "@/components/LoginScreen";
import { Suspense } from "react";

export default function FinanceLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginScreen
                role="finance"
                title="Insert Distributor Finance"
                subtitle="Sign in to Insert Distributor Finance"
                defaultRedirectTo="/finance"
                showSignup={false}
                forgotPasswordPath="/forgot-password?role=finance"
            />
        </Suspense>
    );
}
