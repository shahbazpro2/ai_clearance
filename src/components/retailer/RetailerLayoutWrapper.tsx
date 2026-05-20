"use client";

import { RetailerSidebar } from "@/components/retailer/RetailerSidebar";

export function RetailerLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <RetailerSidebar />

            {/* Main content — offset by sidebar width on desktop, top bar on mobile */}
            <div className="md:ml-64 flex flex-col min-h-screen">
                <div className="flex-1 pt-14 md:pt-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
