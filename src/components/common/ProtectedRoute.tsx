"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useMe } from "@/hooks/useMe";

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requiredRole?: string | string[];
}

export function ProtectedRoute({ children, fallback, requiredRole }: ProtectedRouteProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const userData = useMe();

    useEffect(() => {
        const checkAuth = () => {
            const authenticated = isAuthenticated();

            if (!authenticated) {
                const currentPath = window.location.pathname;
                // Send inventory users to the common login page
                if (currentPath.startsWith("/inventory-portal")) {
                    router.push(`/login?role=inventory&redirect=${encodeURIComponent(currentPath)}`);
                } else {
                    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
                }
                setIsAuth(false);
                setIsLoading(false);
                return;
            }

            // If role check is required
            if (requiredRole) {
                // If we don't have user data yet, keep loading
                if (!userData) {
                    return;
                }

                const allowedRolesRaw = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
                const allowedRoles = allowedRolesRaw.map(r => typeof r === "string" ? r.toLowerCase() : r);
                const userRole = typeof userData.role === "string" ? userData.role.toLowerCase() : userData.role;

                // Check role
                if (!userRole || !allowedRoles.includes(userRole)) {
                    // Redirect to appropriate home based on role
                    if (['admin', 'super_admin'].includes(userRole)) {
                        router.push("/admin");
                    } else if (userRole === 'retailer') {
                        router.push("/retailer/audiences/setup/step");
                    } else if (userRole === 'setup_user') {
                        router.push("/retailer/audiences/setup/step");
                    } else if (userRole === 'finance') {
                        router.push("/finance");
                    } else if (userRole === 'inventory') {
                        router.push("/inventory-portal");
                    } else {
                        router.push("/");
                    }
                    setIsAuth(false);
                } else {
                    setIsAuth(true);
                }
            } else {
                setIsAuth(true);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [router, requiredRole, userData]);

    if (isLoading || (requiredRole && !userData)) {
        return fallback || (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuth) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
