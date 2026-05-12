"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { useApi } from "use-hook-api";
import { syncSpecificSalesforceRetailerApi, deleteRetailerRecordApi } from "@/api/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RetailerUsersTable } from "./RetailerUsersTable";
import { RetailerAudiencesTable } from "./RetailerAudiencesTable";

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

interface Channel {
  channel_id: string;
  name: string;
  status: "active" | "inactive";
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface Audience {
  audience_id: string;
  name: string;
  status: "active" | "inactive";
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  channels: Channel[];
}

interface RetailerAccount {
  account_id: string;
  account_name: string;
  status: RetailerStatus;
  users: RetailerUser[];
  audiences: Audience[];
  created_at: string;
  updated_at: string;
}

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
}: {
  account: RetailerAccount;
  onDeleted: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "audiences">("users");
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
            onClick={handleSyncUsers}
            disabled={syncingUsers}
            size="sm"
          >
            {syncingUsers && <LoadingSpinner size="sm" />}
            <span className={syncingUsers ? "ml-2" : ""}>
              {syncingUsers ? "Syncing..." : "Sync Users"}
            </span>
          </Button>
          {account.status === "inactive" && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deletingAccount}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-t bg-gray-50">
          <td colSpan={7} className="px-4 py-6">
            <div className="space-y-4">
              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === "users"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Users ({account.users.length})
                </button>
                <button
                  onClick={() => setActiveTab("audiences")}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === "audiences"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Audiences ({account.audiences.length})
                </button>
              </div>

              {activeTab === "users" && (
                <RetailerUsersTable
                  users={account.users}
                  onSyncUsers={handleSyncUsers}
                  syncingUsers={syncingUsers}
                  onDeleted={onDeleted}
                />
              )}

              {activeTab === "audiences" && (
                <RetailerAudiencesTable audiences={account.audiences} onDeleted={onDeleted} />
              )}
            </div>
          </td>
        </tr>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{account.account_name}</span>? This cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
              {deletingAccount ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
