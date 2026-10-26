"use client";

import { useMe } from "@/hooks/useMe";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth";
import { LogOut } from "lucide-react";

export function AdminProfileMenu() {
  const userData = useMe();

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "AD";
  };

  const formatRole = (role?: string) => {
    if (!role) return "Admin";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const displayName = userData?.name || userData?.email || "Admin";
  const displayEmail = userData?.email || "";
  const displayRole = formatRole(userData?.role);
  const initials = getInitials(userData?.name, userData?.email);
  const avatarUrl = userData?.avatar || userData?.profile_picture || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Admin profile menu"
          className="flex items-center gap-3 rounded-lg p-1 text-left outline-none transition-colors hover:bg-gray-100/80 focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
        >
          <Avatar className="h-9 w-9 border border-gray-200 shadow-2xs">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold text-gray-900 leading-tight max-w-[140px] truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-gray-400 capitalize">
              {displayRole}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 p-2 shadow-lg border border-gray-200 bg-white"
      >
        {/* User Details Section */}
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10 border border-gray-200 shrink-0 shadow-2xs">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary border border-violet-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-gray-900 truncate" title={displayName}>
              {displayName}
            </span>
            {displayEmail && (
              <span className="text-xs text-gray-500 truncate" title={displayEmail}>
                {displayEmail}
              </span>
            )}
            <div className="mt-1">
              <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-700/10 uppercase tracking-wider">
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 border-gray-100" />

        {/* Logout Action */}
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 focus:text-red-600 focus:bg-red-50 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
