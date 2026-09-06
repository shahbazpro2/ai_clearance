"use client";

import { useAtomValue } from "jotai";
import { sidebarCollapsedAtom } from "@/store/ui";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const collapsed = useAtomValue(sidebarCollapsedAtom);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div
                className={cn(
                    "flex flex-col min-h-screen pt-14 md:pt-0 transition-all duration-300 ease-in-out",
                    collapsed ? "md:ml-20" : "md:ml-64"
                )}
            >
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
