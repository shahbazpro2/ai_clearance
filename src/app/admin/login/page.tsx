import { LoginScreen } from "@/components/LoginScreen";
import { Suspense } from "react";

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginScreen
                role="admin"
                defaultRedirectTo="/admin"
                showSignup={true}
                title="Admin Login"
                signupPath="/admin/signup"
            />
        </Suspense>
    );
}

