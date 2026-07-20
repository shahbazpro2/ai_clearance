"use client";

import { useMe } from "@/hooks/useMe";
import { UserManagementContent } from "@/components/retailer/UserManagementCore";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export function UserManagementPage() {
    const userData = useMe();

    // ─── Access guard ─────────────────────────────────────────────────────────────

    if (userData && userData.role === "retailer") {
        return (
            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mt-12">
                    <Card>
                        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                                <Lock className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
                            <p className="text-sm text-gray-600 max-w-xs">
                                This page is only available for setup administrators. Please contact your account manager.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }


    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage Stakeholder and Finance users for your account.
                </p>
            </div>


            {/* Users content */}

            <div className="bg-white rounded-xl border shadow-sm p-6">
                <UserManagementContent />
            </div>

        </main>
    );
}
