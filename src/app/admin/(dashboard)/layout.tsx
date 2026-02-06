import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AdminLayoutWrapper } from "@/components/admin/AdminLayoutWrapper";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requiredRole={["admin", "super_admin"]}>
            <AdminLayoutWrapper>
                {children}
            </AdminLayoutWrapper>
        </ProtectedRoute>
    );
}
