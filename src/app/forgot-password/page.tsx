import { ForgotPasswordScreen } from "@/components/ForgotPasswordScreen";
import { Suspense } from "react";

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordScreen />
        </Suspense>
    );
}
