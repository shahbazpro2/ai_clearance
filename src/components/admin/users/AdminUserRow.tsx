"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { useApi } from "use-hook-api";
import { setAdminUserStatusApi } from "@/api/admin";
import { Pencil, Trash2 } from "lucide-react";

type AdminStatus = "active" | "pending" | "suspended" | "rejected";

interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  admin_status?: AdminStatus;
  [key: string]: any;
}

const STATUS_OPTIONS: AdminStatus[] = ["active", "pending", "suspended", "rejected"];

export function AdminUserRow({
  user,
  onStatusUpdated,
  onEdit,
  onDelete,
  isCurrentUser = false,
}: {
  user: AdminUser;
  onStatusUpdated?: (userId: string, newStatus: AdminStatus) => void;
  onEdit?: (user: AdminUser) => void;
  onDelete?: (user: AdminUser) => void;
  isCurrentUser?: boolean;
}) {
  const [savedStatus, setSavedStatus] = useState<AdminStatus>(user.admin_status ?? "pending");
  const [localStatus, setLocalStatus] = useState<AdminStatus>(user.admin_status ?? "pending");

  useEffect(() => {
    const status = user.admin_status ?? "pending";
    setSavedStatus(status);
    setLocalStatus(status);
  }, [user.admin_status]);

  const hasChange = localStatus !== savedStatus;

  const [updateStatus, { loading: updating }] = useApi({
    both: true,
    resSuccessMsg: "Status updated successfully",
  });

  const getRowClass = (status: AdminStatus) => {
    const map: Record<AdminStatus, string> = {
      active: "",
      pending: "bg-yellow-50",
      suspended: "bg-orange-50",
      rejected: "bg-red-50",
    };
    return map[status] || "";
  };

  const handleSubmit = () => {
    updateStatus(
      setAdminUserStatusApi({ user_id: user.id, status: localStatus }),
      () => {
        setSavedStatus(localStatus);
        onStatusUpdated?.(user.id, localStatus);
      }
    );
  };

  return (
    <tr className={`border-t ${getRowClass(localStatus)}`}>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full`} />
          <span>{user.name || "-"}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-top">{user.email}</td>
      <td className="px-4 py-3 align-top">
        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
      </td>
      <td className="px-4 py-3 align-top">
        <Select
          value={localStatus}
          onValueChange={(value) => setLocalStatus(value as AdminStatus)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!hasChange || updating}
            className="h-8 text-xs"
          >
            {updating && <LoadingSpinner size="sm" />}
            <span className={updating ? "ml-1.5" : ""}>Update</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => onEdit?.(user)}
            title="Edit user details"
          >
            <Pencil className="h-3.5 w-3.5 mr-1 text-gray-500" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 disabled:opacity-40"
            onClick={() => onDelete?.(user)}
            disabled={isCurrentUser}
            title={isCurrentUser ? "You cannot delete your own account" : "Delete user"}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-red-500" />
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
