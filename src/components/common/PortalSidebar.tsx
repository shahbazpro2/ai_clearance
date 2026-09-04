"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

export interface PortalSidebarItem {
    title: string;
    href: string;
    icon: LucideIcon;
    exact?: boolean;
}

interface PortalSidebarProps {
    collapsed: boolean;
    homeHref: string;
    items: readonly PortalSidebarItem[];
    mobileOpen: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
    onMobileOpenChange: (open: boolean) => void;
    portalName: string;
    secondaryItems?: readonly PortalSidebarItem[];
}

interface SidebarNavProps {
    collapsed?: boolean;
    items: readonly PortalSidebarItem[];
    onItemClick?: () => void;
    pathname: string | null;
}

function SidebarNav({ collapsed = false, items, onItemClick, pathname }: SidebarNavProps) {
    return (
        <nav className="space-y-1 px-3">
            {items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
                const content = (
                    <Link
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                            "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                            collapsed ? "justify-center p-3" : "px-4 py-3",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-gray-500")} />
                        {!collapsed && <span>{item.title}</span>}
                    </Link>
                );

                return collapsed ? (
                    <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                ) : <div key={item.href}>{content}</div>;
            })}
        </nav>
    );
}

function Brand({ collapsed, homeHref, portalName }: Pick<PortalSidebarProps, "collapsed" | "homeHref" | "portalName">) {
    return (
        <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-2" : "p-6")}>
            {collapsed ? (
                <Link
                    href={homeHref}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm"
                    aria-label={`Ai Clearance ${portalName}`}
                >
                    AC
                </Link>
            ) : (
                <div className="flex w-full flex-col">
                    <Link href={homeHref} className="text-xl font-bold text-gray-900 transition-colors hover:text-primary">
                        Ai Clearance
                    </Link>
                    <span className="truncate text-xs font-medium text-gray-500">{portalName}</span>
                </div>
            )}
        </div>
    );
}

function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
    return (
        <button
            type="button"
            onClick={logout}
            className={cn(
                "flex w-full items-center gap-3 rounded-lg text-sm font-medium text-red-500 transition-colors hover:bg-red-50",
                collapsed ? "justify-center p-3" : "px-4 py-3"
            )}
        >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
        </button>
    );
}

export function PortalSidebar({
    collapsed,
    homeHref,
    items,
    mobileOpen,
    onCollapsedChange,
    onMobileOpenChange,
    portalName,
    secondaryItems = [],
}: PortalSidebarProps) {
    const pathname = usePathname();

    return (
        <TooltipProvider>
            <aside className={cn(
                "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r bg-white transition-all duration-300 md:flex",
                collapsed ? "w-20" : "w-64"
            )}>
                <Brand collapsed={collapsed} homeHref={homeHref} portalName={portalName} />

                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => onCollapsedChange(!collapsed)}
                            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                            className="absolute -right-3 top-[18px] z-40 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-colors hover:border-primary/40 hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {collapsed ? "Expand navigation" : "Collapse navigation"}
                    </TooltipContent>
                </Tooltip>

                <div className="flex-1 overflow-y-auto py-4">
                    <SidebarNav collapsed={collapsed} items={items} pathname={pathname} />
                </div>

                {secondaryItems.length > 0 && (
                    <div className="border-t py-2">
                        <SidebarNav collapsed={collapsed} items={secondaryItems} pathname={pathname} />
                    </div>
                )}

                <div className="border-t p-4"><LogoutButton collapsed={collapsed} /></div>
            </aside>

            <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-white px-4 md:hidden">
                <Button variant="ghost" size="icon" onClick={() => onMobileOpenChange(true)} aria-label="Open navigation">
                    <Menu className="h-5 w-5" />
                </Button>
                <span className="text-lg font-bold text-gray-900">Ai Clearance</span>
                <span className="text-xs font-medium text-gray-500">{portalName}</span>
            </div>

            <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
                <SheetContent side="left" className="w-64 bg-white p-0">
                    <div className="flex h-full flex-col">
                        <Brand collapsed={false} homeHref={homeHref} portalName={portalName} />
                        <div className="flex-1 overflow-y-auto py-4">
                            <SidebarNav items={items} pathname={pathname} onItemClick={() => onMobileOpenChange(false)} />
                        </div>
                        {secondaryItems.length > 0 && (
                            <div className="border-t py-2">
                                <SidebarNav items={secondaryItems} pathname={pathname} onItemClick={() => onMobileOpenChange(false)} />
                            </div>
                        )}
                        <div className="border-t p-4"><LogoutButton /></div>
                    </div>
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    );
}
