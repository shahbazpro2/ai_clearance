import { LoginScreen } from "@/components/LoginScreen";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function LoginPage({
    searchParams,
}: {
    searchParams?: Promise<{ role?: string; redirect?: string }>;
}) {
    const params = await searchParams;
    const role = params?.role?.toLowerCase();
    const redirectParam = params?.redirect ? `?redirect=${encodeURIComponent(params.redirect)}` : "";

    if (role === "admin" || role === "super_admin") {
        redirect(`/admin/login${redirectParam}`);
    } else if (role === "finance") {
        redirect(`/finance/login${redirectParam}`);
    } else if (role === "inventory") {
        redirect(`/inventory/login${redirectParam}`);
    }

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
