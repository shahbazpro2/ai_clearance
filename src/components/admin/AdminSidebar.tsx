"use client";

import { Store, Users } from "lucide-react";
import { useAtom } from "jotai";
import { PortalSidebar, type PortalSidebarItem } from "@/components/common/PortalSidebar";
import { useMe } from "@/hooks/useMe";
import { mobileSidebarOpenAtom, sidebarCollapsedAtom } from "@/store/ui";

export function AdminSidebar() {
    const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
    const [mobileOpen, setMobileOpen] = useAtom(mobileSidebarOpenAtom);
    const userData = useMe();
    const items: PortalSidebarItem[] = [
        ...(userData?.role === "admin" || userData?.role === "super_admin"
            ? [{ title: "Retailer Management", href: "/admin/retailers", icon: Store }]
            : []),
        ...(userData?.role === "super_admin"
            ? [{ title: "Admin Users", href: "/admin/users", icon: Users }]
            : []),
    ];

    return (
        <PortalSidebar
            collapsed={collapsed}
            homeHref="/admin/retailers"
            items={items}
            mobileOpen={mobileOpen}
            onCollapsedChange={setCollapsed}
            onMobileOpenChange={setMobileOpen}
            portalName="Admin Portal"
        />
    );
}
