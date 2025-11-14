"use client";

import { Scan, Grid3X3, Info } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export function MobileBottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const navigationItems = [
        {
            key: "scan",
            label: "Scan",
            icon: Scan,
            route: "/dashboard",
            isActive: pathname === "/dashboard"
        },
        {
            key: "collection",
            label: "Collection",
            icon: Grid3X3,
            route: "/dashboard/collection",
            isActive: pathname === "/dashboard/collection"
        },
        {
            key: "about",
            label: "About",
            icon: Info,
            route: "/dashboard/about",
            isActive: pathname === "/dashboard/about"
        }
    ];

    const handleNavigation = (route: string) => {
        router.push(route);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
            <div className="flex items-center justify-around py-2">
                {navigationItems.map(({ key, label, icon: Icon, route, isActive }) => (
                    <button
                        key={key}
                        onClick={() => handleNavigation(route)}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${isActive
                            ? "text-primary bg-primary/10"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        <Icon
                            className={`h-6 w-6 mb-1 ${isActive ? "text-primary" : "text-gray-600"
                                }`}
                        />
                        <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-gray-600"
                            }`}>
                            {label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
