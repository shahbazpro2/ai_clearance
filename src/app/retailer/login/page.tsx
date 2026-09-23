import { LoginScreen } from "@/components/LoginScreen";
import { Suspense } from "react";

export default function RetailerLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginScreen
                role="retailer"
                title="Insert Distributor"
                subtitle="Sign in to your Insert Distributor account"
                defaultRedirectTo="/retailer/audiences/setup/step"
                showSignup={true}
                signupPath="/signup?role=retailer"
                forgotPasswordPath="/forgot-password?role=retailer"
            />
        </Suspense>
    );
}
