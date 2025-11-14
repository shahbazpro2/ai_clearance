import { LoginScreen } from "@/components/LoginScreen";
import { Suspense } from "react";

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginScreen />
        </Suspense>
    );
}
