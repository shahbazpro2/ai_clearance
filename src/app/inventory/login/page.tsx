import { LoginScreen } from "@/components/LoginScreen";
import { Suspense } from "react";

export default function InventoryLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginScreen
                role="inventory"
                title="Insert Distributor Inventory"
                subtitle="Sign in to Insert Distributor Inventory"
                defaultRedirectTo="/inventory"
                showSignup={false}
                forgotPasswordPath="/inventory/forgot-password"
            />
        </Suspense>
    );
}
