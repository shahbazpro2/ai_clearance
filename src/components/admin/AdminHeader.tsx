"use client";

import { useMe } from "@/hooks/useMe";
import { AdminNotificationsBell } from "@/components/admin/notifications/AdminNotificationsBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AdminHeader() {
  const userData = useMe();

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "AD";
  };

  const displayName = userData?.name || userData?.email || "Admin";
  const initials = getInitials(userData?.name, userData?.email);

  return (
    <header className="sticky top-0 z-30 hidden md:flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-6 shadow-xs">
      {/* Brand & Portal Tag */}
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-gray-900 tracking-tight">
          Insert Media — Admin Portal
        </span>
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <AdminNotificationsBell />

        {/* User Profile Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <Avatar className="h-9 w-9 border border-gray-200 shadow-2xs">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold text-gray-900 leading-tight max-w-[140px] truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-gray-400 capitalize">
              {userData?.role?.replace(/_/g, " ") || "Admin"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
