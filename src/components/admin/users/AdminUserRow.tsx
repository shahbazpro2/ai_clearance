"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useApi } from "use-hook-api";
import { setAdminUserStatusApi } from "@/api/admin";

type AdminStatus = "active" | "pending" | "suspended" | "rejected";

interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  admin_status?: AdminStatus;
}

const STATUS_OPTIONS: AdminStatus[] = ["active", "pending", "suspended", "rejected"];

export function AdminUserRow({ user }: { user: AdminUser }) {
  const [localStatus, setLocalStatus] = useState<AdminStatus>(user.admin_status ?? "pending");
  const currentStatus = useMemo<AdminStatus>(() => user.admin_status ?? "pending", [user.admin_status]);
  const hasChange = localStatus !== currentStatus;

  const [updateStatus, { loading: updating }] = useApi({ both: true, resSuccessMsg: "Status updated successfully", refetchApis: ['admin-users'] });

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
      setAdminUserStatusApi({ user_id: user.id, status: localStatus })
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
        <Button
          onClick={handleSubmit}
          disabled={!hasChange || updating}
        >
          {updating && <LoadingSpinner size="sm" />}
          <span className={updating ? "ml-2" : ""}>Update</span>
        </Button>
      </td>
    </tr>
  );
}
