"use client";

import { usePathname } from "next/navigation";
import { AdminNotificationsBell } from "@/components/admin/notifications/AdminNotificationsBell";
import { AdminProfileMenu } from "@/components/admin/AdminProfileMenu";

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
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">
          {pageTitle}
        </h1>
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
