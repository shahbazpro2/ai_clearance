"use client";

import { useRouter } from "next/navigation";
import { LogOut, Package, Menu } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { logout } from "@/lib/auth";
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

export function InventoryNavbar() {
    const router = useRouter();
    const userData = useMe();
    const [mobileOpen, setMobileOpen] = useState(false);

    const getUserName = () => {
        if (!userData) return "User";
        return (
            userData.name ||
            userData.username ||
            userData.email?.split("@")[0] ||
            "User"
        );
    };

    const getUserInitials = () => {
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
                    {/* Left: logo */}
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <button
                            onClick={() => router.push("/inventory-portal")}
                            className="flex items-center gap-2 text-lg font-bold text-gray-900 hover:text-primary transition-colors"
                        >
                            <Package className="h-5 w-5 text-primary" />
                            Inventory Portal
                        </button>
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
                                            src={
                                                userData?.avatar ||
                                                userData?.profile_picture
                                            }
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
                                    <p className="text-sm font-medium">
                                        {getUserName()}
                                    </p>
                                    {userData?.email && (
                                        <p className="text-xs text-gray-500 truncate">
                                            {userData.email}
                                        </p>
                                    )}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={logout}
                                    className="text-red-600 focus:text-red-600"
                                >
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
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-base font-bold text-gray-900">
                                    Inventory Portal
                                </p>
                                <p className="text-xs text-gray-500">
                                    {getUserName()}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1" />
                        <div className="px-3 py-4 border-t">
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
