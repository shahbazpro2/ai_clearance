"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Settings,
    LogOut,
    ArrowLeft
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import { useMe } from "@/hooks/useMe";

export function DashboardNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const userData = useMe();

    const handleLogout = () => {
        logout();
    };

    const getUserName = () => {
        if (!userData) return "User";
        return userData.name || userData.username || userData.email?.split("@")[0] || "User";
    };

    const getUserInitials = () => {
        if (!userData) return "U";
        const name = userData.name || userData.username || userData.email?.split("@")[0] || "User";
        return name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="border-b bg-white backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo or Back Button */}
                    <div className="flex items-center space-x-3">

                        <button
                            onClick={() => router.push("/")}
                            className="text-xl font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer"
                        >
                            Ai Clearance
                        </button>

                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-3">
                        {/* User Info */}
                        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-700">
                            <span className="font-medium">{getUserName()}</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={userData?.avatar || userData?.profile_picture} alt={getUserName()} />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-2 py-1.5 border-b">
                                    <p className="text-sm font-medium">{getUserName()}</p>
                                    {userData?.email && (
                                        <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                                    )}
                                </div>
                                <DropdownMenuItem onClick={() => router.push("/settings")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
}
