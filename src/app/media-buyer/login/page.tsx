import { LoginScreen } from "@/components/LoginScreen";
import { Suspense } from "react";

export default function MediaBuyerLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginScreen
                role="media_buyer_admin"
                title="Media Buyer Portal"
                subtitle="Sign in to your Media Buyer account"
                defaultRedirectTo="/media-buyer/brands"
                showSignup={false}
                forgotPasswordPath="/media-buyer/forgot-password"
            />
        </Suspense>
    );
}
