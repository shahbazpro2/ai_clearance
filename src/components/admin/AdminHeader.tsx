"use client";

import { usePathname } from "next/navigation";
import { AdminNotificationsBell } from "@/components/admin/notifications/AdminNotificationsBell";
import { AdminProfileMenu } from "@/components/admin/AdminProfileMenu";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

function getAdminPageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/users")) {
    return "Admin Users";
  }
  if (pathname.startsWith("/admin/retailers")) {
    return "Distributors Management";
  }
  return "Admin Portal";
}

export function AdminHeader() {
  const pathname = usePathname();
  const pageTitle = getAdminPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 hidden md:flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-6 shadow-xs">
      {/* Page Title & Portal Tag */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">
          {pageTitle}
        </h1>
        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-inset ring-violet-700/10 uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <AdminNotificationsBell />

        {/* User Profile Menu */}
        <div className="flex items-center pl-2 border-l border-gray-200">
          <AdminProfileMenu />
        </div>
      </div>
    </header>
  );
}
