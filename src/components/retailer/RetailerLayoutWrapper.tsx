"use client";

import { RetailerNavbar } from "@/components/retailer/RetailerNavbar";

export function RetailerLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <RetailerNavbar />
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
