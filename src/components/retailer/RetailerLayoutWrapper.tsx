"use client";

import { RetailerSidebar } from "@/components/retailer/RetailerSidebar";
import { useAtomValue } from "jotai";
import { retailerSidebarCollapsedAtom } from "@/store/ui";
import { cn } from "@/lib/utils";

export function RetailerLayoutWrapper({ children }: { children: React.ReactNode }) {
    const collapsed = useAtomValue(retailerSidebarCollapsedAtom);

    return (
        <div className="min-h-screen bg-gray-50">
            <RetailerSidebar />
            <div className={cn(
                "min-h-screen pt-14 md:pt-0 transition-[margin] duration-300",
                collapsed ? "md:ml-20" : "md:ml-64"
            )}>
                {children}
            </div>
        </div>
    );
}
