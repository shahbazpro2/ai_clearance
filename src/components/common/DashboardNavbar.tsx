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
    Scan,
    FolderOpen,
    Info,
    Settings,
    LogOut,
    ArrowLeft
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import Image from "next/image";

export function DashboardNavbar() {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
    };

    const navigationItems = [
        { key: "scan", label: "Scan", route: "/dashboard", icon: Scan },
        { key: "collection", label: "Collection", route: "/dashboard/collection", icon: FolderOpen },
        { key: "about", label: "About", route: "/dashboard/about", icon: Info },
        /*   { key: "settings", label: "Settings", route: "/dashboard/settings", icon: Settings } */
    ];

    const isActiveRoute = (route: string) => {
        if (route === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(route);
    };

    return (
        <header className="border-b bg-white backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo or Back Button */}
                    <div className="flex items-center space-x-3">
                        {pathname.includes('/dashboard/detail') ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Image
                                src="/assets/logo.png"
                                alt="Ai Clerance"
                                width={150}
                                height={32}
                            />
                        )}
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1 w-[420px]">
                        {navigationItems.map(({ key, label, route, icon: Icon }) => (
                            <Button
                                key={key}
                                variant={isActiveRoute(route) ? "default" : "ghost"}
                                size="sm"
                                className={isActiveRoute(route) ? "bg-blue-gradient text-white hover:bg-blue-gradient/90" : "text-gray-700 hover:bg-gray-100"}
                                onClick={() => router.push(route)}
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                {label}
                            </Button>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center space-x-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>

                                <Settings className=" h-6 w-6 text-gray-700 cursor-pointer" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
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
