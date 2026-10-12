"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Settings, Settings2, Warehouse, ClipboardList, UserCircle, BarChart3, CreditCard, Users, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/useMe";
import { logout } from "@/lib/auth";
import { useRetailerView } from "@/lib/retailer-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

const baseNavItems = [
    {
        title: "Audience Profile",
        href: "/retailer/audience-profile",
        icon: UserCircle,
    },
    {
        title: "Channel Setup",
        href: "/retailer/audiences/setup/step",
        icon: Settings,
    },
    {
        title: "Brand Approval Settings",
        href: "/retailer/brand-approval-settings",
        icon: Settings2,
    },
    {
        title: "Distribution Centers",
        href: "/retailer/distribution-centers",
        icon: Warehouse,
    },
    {
        title: "Monthly Projections & Shipment Logs",
        href: "/retailer/projection-shipment-logs",
        icon: BarChart3,
    },
    {
        title: "Order Management",
        href: "/retailer/order-management",
        icon: ClipboardList,
    },
    {
        title: "Payments",
        href: "/retailer/payments",
        icon: CreditCard,
    },
] as const;

const setupUserNavItems = [
    {
        title: "User Management",
        href: "/retailer/user-management",
        icon: Users,
    },
    ...baseNavItems,
] as const;

export function RetailerNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const userData = useMe();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isRetailerView, accountName, exitRetailerView } = useRetailerView();

    const handleBackToAdmin = () => {
        exitRetailerView();
        window.location.href = "/admin/retailers";
    };

    // Channel Setup is available to both retailer roles; User Management remains setup-user only.
    const navItems = userData?.role === "setup_user" ? setupUserNavItems : baseNavItems;

    const getUserName = () => {
        if (!userData) return "User";
        return userData.name || userData.username || userData.email?.split("@")[0] || "User";
    };

    const getUserInitials = () => {
        if (!userData) return "U";
        const name = getUserName();
        return name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="border-b bg-white sticky top-0 z-30">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-14">

                    {/* Left: logo + nav links */}
                    <div className="flex items-center gap-6">
                        {/* Mobile menu trigger */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        {/* Logo */}
                        <button
                            onClick={() => router.push("/retailer/audiences/setup/step")}
                            className="text-lg font-bold text-gray-900 hover:text-primary transition-colors"
                        >
                            Insert Media
                        </button>

                        {/* Desktop nav links */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname?.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-gray-900 hover:bg-gray-100"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right: user menu */}
                    <div className="flex items-center gap-3">
                        <span className="hidden md:block text-sm font-medium text-gray-700">
                            {getUserName()}
                        </span>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="hover:opacity-80 transition-opacity">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={userData?.avatar || userData?.profile_picture}
                                            alt={getUserName()}
                                        />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <div className="px-2 py-1.5 border-b">
                                    <p className="text-sm font-medium">{getUserName()}</p>
                                    {userData?.email && (
                                        <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                                    )}
                                </div>
                                <DropdownMenuSeparator />
                                {isRetailerView && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={handleBackToAdmin}
                                            className="group flex items-center gap-2.5 p-2 text-slate-800 bg-blue-50/70 hover:bg-blue-100/90 focus:bg-blue-100/90 focus:text-slate-900 rounded-lg cursor-pointer transition-colors border border-blue-200/70"
                                        >
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                                                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                                            </div>
                                            <div className="flex flex-col text-left min-w-0">
                                                <span className="text-xs font-semibold text-slate-900 leading-none">Back to Admin</span>
                                                <span className="text-[10px] font-medium text-blue-600 leading-tight mt-0.5 truncate">
                                                    {accountName ? `Exit • ${accountName}` : "Exit Distributor View"}
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-60 p-0 bg-white">
                    <div className="flex flex-col h-full">
                        <div className="px-5 py-4 border-b">
                            <p className="text-lg font-bold text-gray-900">Insert Media</p>
                            <p className="text-xs text-gray-500">Insert Distributor</p>
                        </div>
                        <nav className="flex-1 px-3 py-3 space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname?.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                             "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                             isActive
                                                 ? "bg-primary/10 text-primary"
                                                 : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                         )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="px-3 py-4 border-t flex flex-col gap-2">
                            {isRetailerView && (
                                <button
                                    onClick={handleBackToAdmin}
                                    className="group flex items-center gap-3 p-2.5 rounded-xl w-full text-left bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-blue-50/90 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 shadow-xs transition-all"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                    </div>
                                    <div className="flex flex-col text-left min-w-0 flex-1">
                                        <span className="text-xs font-semibold text-slate-900">Back to Admin</span>
                                        <span className="text-[11px] font-medium text-blue-600/90 truncate">
                                            {accountName ? `Exit • ${accountName}` : "Exit Distributor View"}
                                        </span>
                                    </div>
                                </button>
                            )}
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg w-full text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
}
