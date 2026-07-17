"use client";

import { useMe } from "@/hooks/useMe";
import { useAudienceChannel } from "@/hooks/useAudienceChannel";
import { AudienceChannelSelector } from "@/components/retailer/AudienceChannelSelector";
import { UserManagementContent } from "@/components/retailer/UserManagementCore";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Users } from "lucide-react";

export function UserManagementPage() {
    const userData = useMe();

    const {
        audiences,
        selectedAudienceId,
        loading: loadingAudiences,
        error: audienceError,
        handleAudienceChange,
        refresh,
    } = useAudienceChannel("user-management");

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

    // ─── No audiences empty state ─────────────────────────────────────────────────

    if (!loadingAudiences && audiences.length === 0) {
        return (
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">No Audience Data Available</h2>
                    <p className="text-sm text-gray-500 max-w-sm">
                        This section will become available once account setup is complete.
                    </p>
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

            {/* Audience selector */}
            <div className="mb-5">
                <AudienceChannelSelector
                    audiences={audiences}
                    selectedAudienceId={selectedAudienceId}
                    selectedChannelId={null}
                    selectedAudience={undefined}
                    loading={loadingAudiences}
                    error={audienceError}
                    onAudienceChange={handleAudienceChange}
                    onChannelChange={() => { }}
                    onRefresh={refresh}
                    showChannelStatus={false}
                />
            </div>

            {/* Users content */}
            {selectedAudienceId ? (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <UserManagementContent audienceId={selectedAudienceId} />
                </div>
            ) : (
                !loadingAudiences && (
                    <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm font-medium text-gray-700">Select an audience above</p>
                        <p className="text-xs text-gray-400 mt-1">Users will appear here after you select an audience.</p>
                    </div>
                )
            )}
        </main>
    );
}
