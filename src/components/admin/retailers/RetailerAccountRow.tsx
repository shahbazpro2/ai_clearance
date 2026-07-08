"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { useApi } from "use-hook-api";
import { syncSpecificSalesforceRetailerApi, deleteRetailerRecordApi } from "@/api/admin";
import { RetailerAccount, RetailerStatus } from "./types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RetailerAccountRow({
  account,
  onDeleted,
  onSelect,
}: {
  account: RetailerAccount;
  onDeleted: () => void;
  onSelect: (account: RetailerAccount) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [syncUsers, { loading: syncingUsers }] = useApi({
    both: true,
    resSuccessMsg: "Users synced successfully"
  });

  const [deleteAccount, { loading: deletingAccount }] = useApi({
    both: true,
    resSuccessMsg: "Account deleted successfully"
  });

  const handleSyncUsers = () => {
    syncUsers(
      syncSpecificSalesforceRetailerApi({ account_id: account.account_id })
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    deleteAccount(
      deleteRetailerRecordApi({ account_id: account.account_id }),
      () => {
        onDeleted();
      }
    );
  };

  const getStatusBadgeColor = (status: RetailerStatus) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <tr className="cursor-pointer border-t hover:bg-gray-50" onClick={() => onSelect(account)}>
        <td className="px-4 py-3 align-top text-gray-400">
          <ChevronRight size={18} />
        </td>
        <td className="px-4 py-3 align-top text-sm">{account.account_id}</td>
        <td className="px-4 py-3 align-top font-medium">{account.account_name}</td>
        <td className="px-4 py-3 align-top">
          <Badge className={getStatusBadgeColor(account.status)}>
            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
          </Badge>
        </td>
        <td className="px-4 py-3 align-top text-sm text-gray-600">
          {formatDate(account.created_at)}
        </td>
        <td className="px-4 py-3 align-top text-sm text-gray-600">
          {formatDate(account.updated_at)}
        </td>
        <td className="px-4 py-3 align-top flex items-center gap-2">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              handleSyncUsers();
            }}
            disabled={syncingUsers}
            size="sm"
          >
            {syncingUsers && <LoadingSpinner size="sm" />}
            <span className={syncingUsers ? "ml-2" : ""}>
              {syncingUsers ? "Syncing..." : "Sync Record"}
            </span>
          </Button>
          {account.status === "inactive" && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              disabled={deletingAccount}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </td>
      </tr>

      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(false); }}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{account.account_name}</span>? This cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
              {deletingAccount ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
