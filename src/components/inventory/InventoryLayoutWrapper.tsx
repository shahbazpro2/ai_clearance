"use client";

import { InventoryNavbar } from "@/components/inventory/InventoryNavbar";

export function InventoryLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <InventoryNavbar />
            <div className="flex-1">{children}</div>
        </div>
    );
}
