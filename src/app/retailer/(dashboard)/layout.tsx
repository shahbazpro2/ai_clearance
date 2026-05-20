import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RetailerLayoutWrapper } from "@/components/retailer/RetailerLayoutWrapper";

export default function RetailerDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requiredRole={["retailer"]}>
            <RetailerLayoutWrapper>{children}</RetailerLayoutWrapper>
        </ProtectedRoute>
    );
}
