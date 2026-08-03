"use client";

import { FinanceNavbar } from "./FinanceNavbar";

export function FinanceLayoutWrapper({
    children,
    activeTab,
    onTabChange,
}: {
    children: React.ReactNode;
    activeTab: "orders" | "payments";
    onTabChange: (tab: "orders" | "payments") => void;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <FinanceNavbar activeTab={activeTab} onTabChange={onTabChange} />
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
