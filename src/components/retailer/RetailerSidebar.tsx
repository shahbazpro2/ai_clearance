"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tag, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { retailerMobileSidebarOpenAtom } from "@/store/ui";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";

const sidebarItems = [
    {
        title: "Block Categories",
        href: "/retailer/block-categories",
        icon: Tag,
        exact: false,
    },
] as const;

interface SidebarNavProps {
    pathname: string | null;
    onItemClick?: () => void;
}

function SidebarNav({ pathname, onItemClick }: SidebarNavProps) {
    return (
        <nav className="px-3 space-y-1 flex-1">
            {sidebarItems.map((item) => {
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                        onClick={onItemClick}
                    >
                        <item.icon
                            className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-500")}
                        />
                        <span>{item.title}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export function RetailerSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useAtom(retailerMobileSidebarOpenAtom);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col bg-white border-r h-screen fixed left-0 top-0 w-64 z-30">
                <div className="p-6 h-16 flex items-center border-b">
                    <div className="flex flex-col w-full">
                        <Link
                            href="/retailer"
                            className="text-xl font-bold text-gray-900 hover:text-primary transition-colors"
                        >
                            Ai Clearance
                        </Link>
                        <span className="text-xs text-gray-500 font-medium">Retailer Portal</span>
                    </div>
                </div>

                <div className="flex-1 py-4 overflow-y-auto">
                    <SidebarNav pathname={pathname} />
                </div>

                <div className="p-4 border-t">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile top bar trigger */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b h-14 flex items-center px-4 gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <span className="text-lg font-bold text-gray-900">Ai Clearance</span>
                <span className="text-xs text-gray-500 font-medium">Retailer Portal</span>
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 w-64 bg-white">
                    <div className="flex flex-col h-full">
                        <div className="p-6 h-16 flex items-center border-b">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-gray-900">Ai Clearance</span>
                                <span className="text-xs text-gray-500 font-medium">Retailer Portal</span>
                            </div>
                        </div>

                        <div className="flex-1 py-4 overflow-y-auto">
                            <SidebarNav pathname={pathname} onItemClick={() => setMobileOpen(false)} />
                        </div>

                        <div className="p-4 border-t">
                            <button
                                onClick={logout}
                                className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
