import { ForgotPasswordScreen } from "@/components/ForgotPasswordScreen";
import { Suspense } from "react";

export default function MediaBuyerForgotPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordScreen defaultRole="media_buyer_admin" />
        </Suspense>
    );
}
