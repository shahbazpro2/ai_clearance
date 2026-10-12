"use client";

import { ArrowLeft, BarChart3, ClipboardList, CreditCard, Settings, Settings2, UserCircle, Users, Warehouse } from "lucide-react";
import { useAtom } from "jotai";
import { PortalSidebar, type PortalSidebarItem } from "@/components/common/PortalSidebar";
import { useMe } from "@/hooks/useMe";
import { retailerMobileSidebarOpenAtom, retailerSidebarCollapsedAtom } from "@/store/ui";
import { useRetailerView } from "@/lib/retailer-view";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const baseSidebarItems: readonly PortalSidebarItem[] = [
    { title: "Audience Profile", href: "/retailer/audience-profile", icon: UserCircle },
    { title: "Channel Setup", href: "/retailer/audiences/setup/step", icon: Settings },
    { title: "Brand Approval Settings", href: "/retailer/brand-approval-settings", icon: Settings2 },
    { title: "Distribution Centers", href: "/retailer/distribution-centers", icon: Warehouse },
    { title: "Monthly Projections & Shipment Logs", href: "/retailer/projection-shipment-logs", icon: BarChart3 },
    { title: "Order Management", href: "/retailer/order-management", icon: ClipboardList },
    { title: "Payments", href: "/retailer/payments", icon: CreditCard },
];

function BackToAdminButton({
    collapsed = false,
    accountName,
    onBack,
}: {
    collapsed?: boolean;
    accountName?: string | null;
    onBack: () => void;
}) {
    if (collapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Back to Admin"
                        className="group flex w-full items-center justify-center py-1 transition-all duration-200"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:border-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-md">
                            <ArrowLeft className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        </div>
                    </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex flex-col gap-0.5 py-1.5 px-3">
                    <span className="text-xs font-semibold">Back to Admin</span>
                    <span className="text-[10px] text-muted-foreground">
                        {accountName ? `Exit • ${accountName}` : "Exit Distributor View"}
                    </span>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <button
            type="button"
            onClick={onBack}
            className="group relative flex w-full items-center gap-3 rounded-xl border border-blue-200/90 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/90 p-2.5 text-left transition-all duration-200 hover:border-blue-300 hover:bg-blue-100/70 hover:shadow-xs"
        >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs transition-all duration-200 group-hover:bg-blue-700 group-hover:scale-105">
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-slate-900">Back to Admin</span>
                <span className="truncate text-[11px] font-medium text-blue-600/90">
                    {accountName ? `Exit • ${accountName}` : "Exit Distributor View"}
                </span>
            </div>
        </button>
    );
}

export function RetailerSidebar() {
    const [mobileOpen, setMobileOpen] = useAtom(retailerMobileSidebarOpenAtom);
    const [collapsed, setCollapsed] = useAtom(retailerSidebarCollapsedAtom);
    const userData = useMe();
    const { isRetailerView, accountName, exitRetailerView } = useRetailerView();

    const handleBackToAdmin = () => {
        exitRetailerView();
        window.location.href = "/admin/retailers";
    };

    const userName = userData?.name || userData?.username || userData?.email?.split("@")[0] || "User";
    const userInitials = userName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const items: PortalSidebarItem[] = userData?.role === "setup_user"
        ? [
            { title: "User Management", href: "/retailer/user-management", icon: Users },
            ...baseSidebarItems,
        ]
        : [...baseSidebarItems];

    return (
        <PortalSidebar
            brandClickable={false}
            brandMark="IM"
            brandTitle="Insert Media"
            collapsed={collapsed}
            homeHref="/retailer/audiences/setup/step"
            items={items}
            mobileOpen={mobileOpen}
            onCollapsedChange={setCollapsed}
            onMobileOpenChange={setMobileOpen}
            portalName="Insert Distributor"
            showPortalName={false}
            userProfile={{
                avatarUrl: userData?.avatar || userData?.profile_picture,
                initials: userInitials,
                name: userName,
            }}
            beforeLogout={
                isRetailerView
                    ? (isCollapsed) => (
                        <BackToAdminButton
                            collapsed={isCollapsed}
                            accountName={accountName}
                            onBack={handleBackToAdmin}
                        />
                    )
                    : undefined
            }
        />
    );
}
