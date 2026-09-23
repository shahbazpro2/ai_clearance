import { InventoryForgotPasswordScreen } from "@/components/inventory/InventoryForgotPasswordScreen";
import { Suspense } from "react";

export default function InventoryForgotPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InventoryForgotPasswordScreen />
        </Suspense>
    );
}
