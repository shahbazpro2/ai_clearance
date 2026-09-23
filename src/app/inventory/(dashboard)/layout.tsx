import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { InventoryLayoutWrapper } from "@/components/inventory/InventoryLayoutWrapper";

export default function InventoryDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requiredRole={["inventory"]}>
            <InventoryLayoutWrapper>{children}</InventoryLayoutWrapper>
        </ProtectedRoute>
    );
}
