"use client";

import { BarChart3, ClipboardList, CreditCard, Settings, Settings2, UserCircle, Users, Warehouse } from "lucide-react";
import { useAtom } from "jotai";
import { PortalSidebar, type PortalSidebarItem } from "@/components/common/PortalSidebar";
import { useMe } from "@/hooks/useMe";
import { retailerMobileSidebarOpenAtom, retailerSidebarCollapsedAtom } from "@/store/ui";

const baseSidebarItems: readonly PortalSidebarItem[] = [
    { title: "Audience Profile", href: "/retailer/audience-profile", icon: UserCircle },
    { title: "Brand Approval Settings", href: "/retailer/brand-approval-settings", icon: Settings2 },
    { title: "Distribution Centers", href: "/retailer/distribution-centers", icon: Warehouse },
    { title: "Order Management", href: "/retailer/order-management", icon: ClipboardList },
    { title: "Projection & Shipment Logs", href: "/retailer/projection-shipment-logs", icon: BarChart3 },
    { title: "Payments", href: "/retailer/payments", icon: CreditCard },
];

export function RetailerSidebar() {
    const [mobileOpen, setMobileOpen] = useAtom(retailerMobileSidebarOpenAtom);
    const [collapsed, setCollapsed] = useAtom(retailerSidebarCollapsedAtom);
    const userData = useMe();
    const userName = userData?.name || userData?.username || userData?.email?.split("@")[0] || "User";
    const userInitials = userName
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const items: PortalSidebarItem[] = userData?.role === "setup_user"
        ? [
            { title: "Account Setup", href: "/retailer/audiences/setup/step", icon: Settings },
            { title: "User Management", href: "/retailer/user-management", icon: Users },
            ...baseSidebarItems,
        ]
        : [...baseSidebarItems];

    return (
        <PortalSidebar
            brandMark="IM"
            brandTitle="Insert Media"
            collapsed={collapsed}
            homeHref="/retailer"
            items={items}
            mobileOpen={mobileOpen}
            onCollapsedChange={setCollapsed}
            onMobileOpenChange={setMobileOpen}
            portalName="Retailer Portal"
            showPortalName={false}
            userProfile={{
                avatarUrl: userData?.avatar || userData?.profile_picture,
                initials: userInitials,
                name: userName,
            }}
        />
    );
}
