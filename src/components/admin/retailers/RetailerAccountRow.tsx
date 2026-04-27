"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo } from "react";
import { useApi } from "use-hook-api";
import { updateRetailerAccountStatusApi, syncSpecificSalesforceRetailerApi } from "@/api/admin";
import { RetailerUsersTable } from "./RetailerUsersTable";

type RetailerStatus = "active" | "inactive";

interface RetailerUser {
  contact_id: string;
  name: string;
  email: string;
  status: RetailerStatus;
  role: string;
  created_at: string;
  updated_at: string;
}

interface RetailerAccount {
  account_id: string;
  account_name: string;
  status: RetailerStatus;
  users: RetailerUser[];
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS: RetailerStatus[] = ["active", "inactive"];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RetailerAccountRow({
  account,
  onStatusUpdate
}: {
  account: RetailerAccount;
  onStatusUpdate?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<RetailerStatus>(account.status);
  const currentStatus = useMemo<RetailerStatus>(() => account.status, [account.status]);
  const hasChange = localStatus !== currentStatus;
  const [showConfirm, setShowConfirm] = useState(false);

  const [updateStatus, { loading: updating }] = useApi({
    both: true,
    resSuccessMsg: "Account status updated successfully"
  });
  const [syncUsers, { loading: syncingUsers }] = useApi({
    both: true,
    resSuccessMsg: "Users synced successfully"
  });

  const handleStatusChange = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    updateStatus(
      updateRetailerAccountStatusApi({
        account_id: account.account_id,
        account_status: localStatus
      }),
      () => {
        onStatusUpdate?.();
      }
    );
  };

  const handleSyncUsers = () => {
    syncUsers(
      syncSpecificSalesforceRetailerApi({ account_id: account.account_id })
    );
  };

  const getStatusColor = (status: RetailerStatus) => {
    return status === "active"
      ? "text-green-600"
      : "text-gray-600";
  };

  return (
    <>
      <tr className="border-t hover:bg-gray-50">
        <td className="px-4 py-3 align-top">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </td>
        <td className="px-4 py-3 align-top text-sm">{account.account_id}</td>
        <td className="px-4 py-3 align-top font-medium">{account.account_name}</td>
        <td className="px-4 py-3 align-top">
          <Select
            value={localStatus}
            onValueChange={(value) => setLocalStatus(value as RetailerStatus)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
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
        <td className="px-4 py-3 align-top text-sm text-gray-600">
          {formatDate(account.created_at)}
        </td>
        <td className="px-4 py-3 align-top text-sm text-gray-600">
          {formatDate(account.updated_at)}
        </td>
        <td className="px-4 py-3 align-top">
          <Button
            onClick={handleStatusChange}
            disabled={!hasChange || updating}
            size="sm"
          >
            {updating && <LoadingSpinner size="sm" />}
            <span className={updating ? "ml-2" : ""}>
              {updating ? "Updating..." : "Update"}
            </span>
          </Button>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-t bg-gray-50">
          <td colSpan={7} className="px-4 py-6">
            <RetailerUsersTable
              users={account.users}
              accountId={account.account_id}
              onSyncUsers={handleSyncUsers}
              syncingUsers={syncingUsers}
              onUserStatusUpdate={onStatusUpdate}
            />
          </td>
        </tr>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Update Account Status</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to update the status to{" "}
            <span className={`font-semibold ${getStatusColor(localStatus)}`}>
              {localStatus.charAt(0).toUpperCase() + localStatus.slice(1)}
            </span>
            ?
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Save
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
