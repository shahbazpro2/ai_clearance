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
import {
  updateMediaBuyerUserApi,
  type MediaBuyerUser,
  type MediaBuyerUserStatus,
} from "@/api/mediaBuyer";
import { SlidersHorizontal, BadgeCheck } from "lucide-react";
import { toast } from "react-toastify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MediaBuyerUserRowProps {
  user: MediaBuyerUser;
  onStatusUpdated?: (userId: string, newStatus: MediaBuyerUserStatus) => void;
  onManage?: (user: MediaBuyerUser) => void;
  isCurrentUser?: boolean;
}

export function MediaBuyerUserRow({
  user,
  onStatusUpdated,
  onManage,
  isCurrentUser = false,
}: MediaBuyerUserRowProps) {
  const rawStatus = (user.user_status || user.status || "active").toLowerCase();
  const isPending = rawStatus === "pending";
  const normalizedStatus = rawStatus === "inactive" ? "inactive" : "active";

  const [currentStatus, setCurrentStatus] = useState<string>(
    isPending ? "pending" : normalizedStatus
  );

  useEffect(() => {
    const s = (user.user_status || user.status || "active").toLowerCase();
    if (s === "pending") {
      setCurrentStatus("pending");
    } else if (s === "inactive") {
      setCurrentStatus("inactive");
    } else {
      setCurrentStatus("active");
    }
  }, [user.user_status, user.status]);

  const [callUpdateStatus, { loading: updatingStatus }] = useApi({
    successMsg: true,
    errMsg: false,
    resSuccessMsg: "Media Buyer user status updated successfully.",
  });

  const handleStatusChange = (newStatus: "active" | "inactive") => {
    if (isPending || newStatus === currentStatus || updatingStatus) return;
    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);

    callUpdateStatus(
      updateMediaBuyerUserApi(user.id, {
        status: newStatus,
      }),
      () => {
        onStatusUpdated?.(user.id, newStatus);
      },
      (err: any) => {
        setCurrentStatus(previousStatus);
        const errMsg =
          err?.detail?.message ??
          err?.data?.message ??
          err?.message ??
          "Failed to update user status.";
        toast.error(errMsg);
      },
      { errMsg: false }
    );
  };

  const isVerified = Boolean(user.is_verified);

  const formatRole = (role?: string) => {
    if (!role) return "Media Buyer Standard";
    return role
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <tr className="border-t hover:bg-blue-50/40 transition-colors">
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
                <TooltipContent
                  side="top"
                  className="text-xs font-medium bg-gray-900 text-white px-2 py-1 rounded-md shadow-md"
                >
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
      <td className="px-4 py-3 align-middle text-gray-700">
        {formatRole(user.role)}
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
              onValueChange={(val) => handleStatusChange(val as "active" | "inactive")}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-32 h-8 text-xs font-medium border-gray-200 bg-white focus:ring-blue-500 focus:border-blue-500">
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
          className="h-8 px-2.5 text-xs font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200 border-gray-300 transition-colors"
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
