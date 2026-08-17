"use client";

import { useMe } from "@/hooks/useMe";
import { Settings2, Warehouse, ClipboardList, BarChart3 } from "lucide-react";
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                    href="/retailer/brand-approval-settings"
                    className="flex items-start gap-4 p-5 bg-white border rounded-xl hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 mb-1">Brand Approval Settings</h2>
                        <p className="text-sm text-gray-500">
                            Configure approval settings for all categories and brands by channel.
                        </p>
                    </div>
                </Link>

                <Link
                    href="/retailer/distribution-centers"
                    className="flex items-start gap-4 p-5 bg-white border rounded-xl hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Warehouse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 mb-1">Distribution Centers</h2>
                        <p className="text-sm text-gray-500">
                            Configure your distribution center locations and allocations.
                        </p>
                    </div>
                </Link>

                <Link
                    href="/retailer/order-management"
                    className="flex items-start gap-4 p-5 bg-white border rounded-xl hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 mb-1">Order Management</h2>
                        <p className="text-sm text-gray-500">
                            View and track orders by audience and channel, grouped by month.
                        </p>
                    </div>
                </Link>

                <Link
                    href="/retailer/projection-shipment-logs"
                    className="flex items-start gap-4 p-5 bg-white border rounded-xl hover:shadow-md transition-shadow"
                >
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 mb-1">Projection &amp; Shipment Logs</h2>
                        <p className="text-sm text-gray-500">
                            View monthly shipment projections and log history by channel.
                        </p>
                    </div>
                </Link>
            </div>
        </main>
    );
}
