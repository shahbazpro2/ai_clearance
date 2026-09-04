"use client";

import { BookOpen, Bot, ClipboardList, FileText, LayoutDashboard, Settings, Store, Users } from "lucide-react";
import { useAtom } from "jotai";
import { PortalSidebar, type PortalSidebarItem } from "@/components/common/PortalSidebar";
import { useMe } from "@/hooks/useMe";
import { mobileSidebarOpenAtom, sidebarCollapsedAtom } from "@/store/ui";

const baseSidebarItems: readonly PortalSidebarItem[] = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    { title: "Manual Reviews", href: "/admin/manual-reviews", icon: FileText },
    { title: "Manual Availability Review", href: "/admin/manual-availability-reviews", icon: ClipboardList },
    { title: "Complete Booking Review", href: "/admin/complete-booking-review", icon: BookOpen },
    { title: "Fine-Tuning", href: "/admin/fine-tuning", icon: Bot },
];

const settingsItems: readonly PortalSidebarItem[] = [
    { title: "Settings", href: "/settings", icon: Settings },
];

export function AdminSidebar() {
    const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
    const [mobileOpen, setMobileOpen] = useAtom(mobileSidebarOpenAtom);
    const userData = useMe();
    const items: PortalSidebarItem[] = [
        ...baseSidebarItems,
        ...(userData?.role === "admin" || userData?.role === "super_admin"
            ? [{ title: "Retailers Management", href: "/admin/retailers", icon: Store }]
            : []),
        ...(userData?.role === "super_admin"
            ? [{ title: "Admin Users", href: "/admin/users", icon: Users }]
            : []),
    ];

    return (
        <PortalSidebar
            collapsed={collapsed}
            homeHref="/admin"
            items={items}
            mobileOpen={mobileOpen}
            onCollapsedChange={setCollapsed}
            onMobileOpenChange={setMobileOpen}
            portalName="Admin Portal"
            secondaryItems={settingsItems}
        />
    );
}
