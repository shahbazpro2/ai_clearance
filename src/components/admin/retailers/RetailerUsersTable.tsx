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
import { useState, useMemo } from "react";
import { useApi } from "use-hook-api";
import { updateRetailerAccountStatusApi } from "@/api/admin";

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

const STATUS_OPTIONS: UserStatus[] = ["active", "inactive"];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RetailerUsersTable({
  users,
  accountId,
  onSyncUsers,
  syncingUsers,
  onUserStatusUpdate
}: {
  users: RetailerUser[];
  accountId: string;
  onSyncUsers: () => void;
  syncingUsers: boolean;
  onUserStatusUpdate?: () => void;
}) {
  const userStatusStates = useMemo(() => {
    const states: Record<string, { current: UserStatus; local: UserStatus }> = {};
    users.forEach((user) => {
      states[user.contact_id] = {
        current: user.status,
        local: user.status,
      };
    });
    return states;
  }, [users]);

  const [userStatusStatesLocal, setUserStatusStatesLocal] = useState(userStatusStates);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [nextLocalStatus, setNextLocalStatus] = useState<UserStatus | null>(null);

  const [updateStatus, { loading: updating }] = useApi({
    both: true,
    resSuccessMsg: "User status updated successfully"
  });

  const getHasChange = (contactId: string) => {
    const state = userStatusStatesLocal[contactId];
    return state && state.local !== state.current;
  };

  const handleUserStatusChange = (contactId: string, newStatus: UserStatus) => {
    setUserStatusStatesLocal((prev) => ({
      ...prev,
      [contactId]: {
        ...prev[contactId],
        local: newStatus,
      },
    }));
  };

  const handleUserStatusConfirm = (contactId: string) => {
    setShowConfirm(contactId);
  };

  const handleConfirm = () => {
    if (!showConfirm || !nextLocalStatus) return;

    setShowConfirm(null);
    updateStatus(
      updateRetailerAccountStatusApi({
        account_id: accountId,
        user: {
          contact_id: showConfirm,
          status: nextLocalStatus,
        },
      }),
      () => {
        onUserStatusUpdate?.();
        setUserStatusStatesLocal((prev) => ({
          ...prev,
          [showConfirm]: {
            ...prev[showConfirm],
            current: nextLocalStatus,
          },
        }));
      }
    );
  };

  const getUserRow = (user: RetailerUser) => {
    const state = userStatusStatesLocal[user.contact_id];
    const hasChange = state && state.local !== state.current;
    const currentStatus = state?.current || user.status;

    return (
      <tr key={user.contact_id} className="border-b last:border-b-0 hover:bg-white/50">
        <td className="px-4 py-3 text-sm text-gray-500">{user.contact_id}</td>
        <td className="px-4 py-3 font-medium">{user.name}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
        <td className="px-4 py-3">
          <Select
            value={state?.local || user.status}
            onValueChange={(value) => handleUserStatusChange(user.contact_id, value as UserStatus)}
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
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatDate(user.created_at)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatDate(user.updated_at)}
        </td>
        <td className="px-4 py-3">
          <Button
            onClick={() => {
              setNextLocalStatus(state?.local || user.status);
              handleUserStatusConfirm(user.contact_id);
            }}
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

      <AlertDialog open={showConfirm !== null} onOpenChange={(open) => !open && setShowConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Update User Status</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to update the status to{" "}
            <span className="font-semibold">
              {nextLocalStatus ? nextLocalStatus.charAt(0).toUpperCase() + nextLocalStatus.slice(1) : ""}
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
    </div>
  );
}
