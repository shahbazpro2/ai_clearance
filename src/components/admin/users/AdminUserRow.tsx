"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useApi } from "use-hook-api";
import { updateAdminUserApi } from "@/api/admin";
import { SlidersHorizontal, BadgeCheck } from "lucide-react";
import { toast } from "react-toastify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AdminStatus = "active" | "pending" | "suspended" | "rejected" | "inactive";

export interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  admin_status?: AdminStatus;
  status?: AdminStatus;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface AdminUserRowProps {
  user: AdminUser;
  onStatusUpdated?: (userId: string, newStatus: AdminStatus) => void;
  onManage?: (user: AdminUser) => void;
  onDelete?: (user: AdminUser) => void;
  isCurrentUser?: boolean;
}

export function AdminUserRow({
  user,
  onStatusUpdated,
  onManage,
  onDelete,
  isCurrentUser = false,
}: AdminUserRowProps) {
  const rawStatus = (user.admin_status || user.status || "active").toLowerCase();
  const isPending = rawStatus === "pending";
  const normalizedStatus =
    rawStatus === "suspended" || rawStatus === "inactive" || rawStatus === "rejected"
      ? "inactive"
      : "active";

  const [currentStatus, setCurrentStatus] = useState<string>(
    isPending ? "pending" : normalizedStatus
  );

  useEffect(() => {
    const s = (user.admin_status || user.status || "active").toLowerCase();
    if (s === "pending") {
      setCurrentStatus("pending");
    } else if (s === "suspended" || s === "inactive" || s === "rejected") {
      setCurrentStatus("inactive");
    } else {
      setCurrentStatus("active");
    }
  }, [user.admin_status, user.status]);

  const [callUpdateStatus, { loading: updatingStatus }] = useApi({
    both: true,
    resSuccessMsg: "User status updated successfully.",
    errMsg: false,
  });

  const handleStatusChange = (newStatus: string) => {
    if (isPending || newStatus === currentStatus || updatingStatus) return;
    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);

    callUpdateStatus(
      updateAdminUserApi(user.id, {
        status: newStatus,
        admin_status: newStatus,
      }),
      () => {
        onStatusUpdated?.(user.id, newStatus as AdminStatus);
      },
      (err: any) => {
        setCurrentStatus(previousStatus);
        const errMsg =
          err?.data?.message ??
          err?.message ??
          "Failed to update user status.";
        toast.error(errMsg);
      }
    );
  };

  const isVerified = Boolean(user.is_verified);

  return (
    <tr className="border-t hover:bg-violet-50/40 transition-colors">
      {/* Name with subtle Verified Badge */}
      <td className="px-4 py-3 align-middle">
        <div className="inline-flex items-center gap-1.5">
          <span className="font-medium text-gray-900">{user.name || "-"}</span>
          {isVerified && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center justify-center text-emerald-600/60 hover:text-emerald-600 transition-colors cursor-default"
                    aria-label="Verified account"
                  >
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-medium bg-gray-900 text-white px-2 py-1 rounded-md shadow-md">
                  Verified Account
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3 align-middle text-gray-700">{user.email}</td>

      {/* Role */}
      <td className="px-4 py-3 align-middle text-gray-700 capitalize">
        {user.role ? user.role.replace(/_/g, " ") : "Admin"}
      </td>

      {/* Status: Inline Auto-Saving Dropdown or Pending Text */}
      <td className="px-4 py-3 align-middle">
        {isPending ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs select-none"
            title="Pending user status cannot be changed to Active or Inactive until verified"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <Select
              value={currentStatus}
              onValueChange={handleStatusChange}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-32 h-8 text-xs font-medium border-gray-200 bg-white focus:ring-violet-500 focus:border-violet-500">
                {updatingStatus ? (
                  <div className="flex items-center gap-1.5">
                    <LoadingSpinner size="sm" />
                    <span className="text-gray-400">Saving...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select status" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </SelectItem>
                <SelectItem value="inactive" className="text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    Inactive
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </td>

      {/* Actions: Manage */}
      <td className="px-4 py-3 align-middle">
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs font-medium text-gray-700 hover:text-violet-700 hover:bg-violet-50 hover:border-violet-200 border-gray-300 transition-colors"
          onClick={() => onManage?.(user)}
          title="Manage user details"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1 text-gray-500" />
          Manage
        </Button>
      </td>
    </tr>
  );
}
