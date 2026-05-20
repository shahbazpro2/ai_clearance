"use client";

import { useMe } from "@/hooks/useMe";
import { Tag } from "lucide-react";
import Link from "next/link";

export default function RetailerDashboardPage() {
    const userData = useMe();

    const getUserName = () => {
        if (!userData) return "User";
        return userData.name || userData.username || userData.email?.split("@")[0] || "User";
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Welcome, {getUserName()}
                </h1>
                <p className="text-gray-500 text-sm">Retailer Portal</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    href="/retailer/block-categories"
                    className="flex items-start gap-4 p-5 bg-white border rounded-xl hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 mb-1">Block Categories</h2>
                        <p className="text-sm text-gray-500">
                            Manage which categories are allowed or blocked for your channel.
                        </p>
                    </div>
                </Link>
            </div>
        </main>
    );
}
