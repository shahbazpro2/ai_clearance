import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export default function FinanceDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requiredRole={["finance"]}>
            {children}
        </ProtectedRoute>
    );
}
