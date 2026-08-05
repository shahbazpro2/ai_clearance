import { InventoryLoginScreen } from "@/components/inventory/InventoryLoginScreen";
import { Suspense } from "react";

export default function InventoryPortalLoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InventoryLoginScreen />
        </Suspense>
    );
}
