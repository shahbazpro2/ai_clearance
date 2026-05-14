"use client";

import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
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
import { useState } from "react";

interface Channel {
  channel_id: string;
  name: string;
  status: "active" | "inactive";
  is_completed: boolean;
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

function getStatusBadgeColor(status: string) {
  return status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
}

function getCompletedBadgeColor(isCompleted: boolean) {
  return isCompleted
    ? "bg-blue-100 text-blue-800"
    : "bg-gray-100 text-gray-800";
}

export function RetailerChannelsTable({
  channels,
  onDeleted,
}: {
  channels: Channel[];
  onDeleted: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ channel_id: string; name: string } | null>(null);

  const [deleteChannel, { loading: deletingChannel }] = useApi({
    both: true,
    resSuccessMsg: "Channel deleted successfully"
  });

  const handleDeleteChannel = () => {
    if (!showDeleteConfirm) return;
    deleteChannel(
      deleteRetailerRecordApi({ channel_id: showDeleteConfirm.channel_id }),
      () => {
        setShowDeleteConfirm(null);
        onDeleted();
      }
    );
  };

  if (channels.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        No channels found
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Channel Id</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Updated At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.channel_id} className="border-b last:border-b-0 hover:bg-white/50">
                <td className="px-4 py-3 text-sm text-gray-500">{channel.channel_id}</td>
                <td className="px-4 py-3 font-medium">{channel.name}</td>
                <td className="px-4 py-3">
                  <Badge className={getStatusBadgeColor(channel.status)}>
                    {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={getCompletedBadgeColor(channel.is_completed)}>
                    {channel.is_completed ? "Completed" : "Pending"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(channel.created_at)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(channel.updated_at)}
                </td>
                <td className="px-4 py-3">
                  {channel.status === "inactive" && (
                    <button
                      onClick={() => setShowDeleteConfirm({ channel_id: channel.channel_id, name: channel.name })}
                      disabled={deletingChannel}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{showDeleteConfirm?.name}</span>? This cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChannel} className="bg-red-600 hover:bg-red-700">
              {deletingChannel ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
