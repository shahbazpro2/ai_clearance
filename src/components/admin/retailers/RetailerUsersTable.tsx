"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useApi } from "use-hook-api";
import { deleteRetailerRecordApi } from "@/api/admin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserStatus = "active" | "inactive";

interface RetailerUser {
  contact_id: string;
  name: string;
  email: string;
  status: UserStatus;
  role: string;
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

function getStatusBadgeColor(status: UserStatus) {
  return status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
}

export function RetailerUsersTable({
  users,
  onSyncUsers,
  syncingUsers,
  onDeleted,
}: {
  users: RetailerUser[];
  onSyncUsers: () => void;
  syncingUsers: boolean;
  onDeleted: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ contact_id: string; name: string } | null>(null);

  const [deleteUser, { loading: deletingUser }] = useApi({
    both: true,
    resSuccessMsg: "User deleted successfully"
  });

  const handleDeleteUser = () => {
    if (!showDeleteConfirm) return;
    deleteUser(
      deleteRetailerRecordApi({ contact_id: showDeleteConfirm.contact_id }),
      () => {
        setShowDeleteConfirm(null);
        onDeleted();
      }
    );
  };

  const getUserRow = (user: RetailerUser) => {
    return (
      <tr key={user.contact_id} className="border-b last:border-b-0 hover:bg-white/50">
        <td className="px-4 py-3 text-sm text-gray-500">{user.contact_id}</td>
        <td className="px-4 py-3 font-medium">{user.name}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
        <td className="px-4 py-3">
          <Badge className={getStatusBadgeColor(user.status)}>
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatDate(user.created_at)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatDate(user.updated_at)}
        </td>
        <td className="px-4 py-3">
          {user.status === "inactive" && (
            <button
              onClick={() => setShowDeleteConfirm({ contact_id: user.contact_id, name: user.name })}
              disabled={deletingUser}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Users ({users.length})</h3>
        <Button
          onClick={onSyncUsers}
          disabled={syncingUsers}
          variant="outline"
          size="sm"
        >
          {syncingUsers && <LoadingSpinner size="sm" />}
          <span className={syncingUsers ? "ml-2" : ""}>
            {syncingUsers ? "Syncing..." : "Sync Salesforce Retailer Users"}
          </span>
        </Button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-6 text-sm text-gray-500">
          No users found for this retailer
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Contact Id</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Updated At</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => getUserRow(user))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{showDeleteConfirm?.name}</span>? This cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              {deletingUser ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
