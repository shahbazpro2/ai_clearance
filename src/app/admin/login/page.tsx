import { LoginScreen } from "@/components/LoginScreen";
import { Suspense } from "react";

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginScreen
                role="admin"
                title="Admin Portal"
                subtitle="Sign in to your Admin account"
                defaultRedirectTo="/admin"
                showSignup={false}
            />
        </Suspense>
    );
}
