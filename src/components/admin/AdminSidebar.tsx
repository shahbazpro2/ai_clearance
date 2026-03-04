"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ClipboardList, BookOpen, Settings, ChevronLeft, ChevronRight, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { sidebarCollapsedAtom, mobileSidebarOpenAtom } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { logout } from "@/lib/auth";
import { useMe } from "@/hooks/useMe";

const baseSidebarItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        title: "Manual Reviews",
        href: "/admin/manual-reviews",
        icon: FileText,
        exact: false,
    },
    {
        title: "Manual Availability Review",
        href: "/admin/manual-availability-reviews",
        icon: ClipboardList,
        exact: false,
    },
    {
        title: "Complete Booking Review",
        href: "/admin/complete-booking-review",
        icon: BookOpen,
        exact: false,
    },
] as const;

interface SidebarNavProps {
    items: Array<{
        title: string;
        href: string;
        icon: any;
        exact: boolean;
    }>;
    collapsed?: boolean;
    pathname: string | null;
    onItemClick?: () => void;
}

function SidebarNav({ items, collapsed, pathname, onItemClick }: SidebarNavProps) {
    return (
        <nav className="px-3 space-y-2 flex-1">
            {items.map((item) => {
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);

                const content = (
                    <Link
                        href={item.href}
                        className={cn(
                            "flex items-center space-x-3 rounded-lg transition-colors text-sm font-medium",
                            collapsed ? "justify-center p-3" : "px-4 py-3",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        onClick={onItemClick}
                    >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-500")} />
                        {!collapsed && <span>{item.title}</span>}
                    </Link>
                );

                if (collapsed) {
                    return (
                        <Tooltip key={item.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                {content}
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {item.title}
                            </TooltipContent>
                        </Tooltip>
                    );
                }

                return <div key={item.href}>{content}</div>;
            })}
        </nav>
    );
}

export function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
    const [mobileOpen, setMobileOpen] = useAtom(mobileSidebarOpenAtom);
    const userData = useMe();
    const items = [
        ...baseSidebarItems,
        ...(userData?.role === "super_admin"
            ? [
                {
                    title: "Admin Users",
                    href: "/admin/users",
                    icon: Users,
                    exact: false,
                },
            ]
            : []),
    ];

    return (
        <TooltipProvider>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col bg-white border-r h-screen fixed left-0 top-0 transition-all duration-300 z-30",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <div className={cn("p-6 flex items-center h-16", collapsed ? "justify-center px-2" : "justify-between")}>
                    {!collapsed && <div className="flex flex-col items-center w-full justify-center">
                        <Link
                            href="/admin"
                            className="text-xl font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer"
                        >
                            Ai Clearance
                        </Link>
                        <h2 className="text-sm font-bold text-gray-500 truncate">Admin Portal</h2>
                    </div>}
                </div>

                <SidebarNav items={items} collapsed={collapsed} pathname={pathname} />

                <div className={cn("p-4 border-t", collapsed ? "flex justify-center" : "")}>
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center space-x-3 rounded-lg transition-colors text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                            collapsed ? "justify-center p-3" : "px-4 py-3"
                        )}
                    >
                        <Settings className="h-5 w-5 text-gray-500" />
                        {!collapsed && <span>Settings</span>}
                    </Link>
                </div>

                <div className="flex justify-end p-4 border-t">
                    <div className="flex gap-2 text-red-500 cursor-pointer items-center pl-5" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        {!collapsed && <span>Logout</span>}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn("ml-auto", collapsed && "mx-auto")}
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-64 bg-white">
                    <div className="flex flex-col h-full">
                        <div className="p-6 h-16 flex items-center">
                            <h2 className="text-xl font-bold text-gray-800">Admin Portal</h2>
                        </div>

                        <SidebarNav
                            items={items}
                            collapsed={false}
                            pathname={pathname}
                            onItemClick={() => setMobileOpen(false)}
                        />

                        <div className="absolute bottom-0 w-full p-4 border-t">
                            <Link
                                href="/settings"
                                className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            >
                                <Settings className="h-5 w-5 text-gray-500" />
                                <span>Settings</span>
                            </Link>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    );
}
