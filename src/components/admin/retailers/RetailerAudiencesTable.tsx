"use client";

import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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

type AudienceStatus = "active" | "inactive";

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
  status: AudienceStatus;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  channels: Channel[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadgeColor(status: AudienceStatus) {
  return status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
}

function getCompletedBadgeColor(isCompleted: boolean) {
  return isCompleted
    ? "bg-blue-100 text-blue-800"
    : "bg-gray-100 text-gray-800";
}

export function RetailerAudiencesTable({
  audiences,
  onDeleted,
}: {
  audiences: Audience[];
  onDeleted: () => void;
}) {
  const [expandedAudienceId, setExpandedAudienceId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: "audience" | "channel"; id: string; name: string } | null>(null);

  const [deleteRecord, { loading: deletingRecord }] = useApi({
    both: true,
    resSuccessMsg: "Record deleted successfully"
  });

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    const params =
      showDeleteConfirm.type === "audience"
        ? { audience_id: showDeleteConfirm.id }
        : { channel_id: showDeleteConfirm.id };
    deleteRecord(deleteRetailerRecordApi(params as any), () => {
      setShowDeleteConfirm(null);
      onDeleted();
    });
  };

  if (audiences.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        No audiences found for this retailer
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Audience Id</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3">Updated At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {audiences.map((audience) => (
              <>
                <tr key={audience.audience_id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">
                    <button
                      onClick={() =>
                        setExpandedAudienceId(
                          expandedAudienceId === audience.audience_id
                            ? null
                            : audience.audience_id
                        )
                      }
                      className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded"
                    >
                      {expandedAudienceId === audience.audience_id ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{audience.audience_id}</td>
                  <td className="px-4 py-3 font-medium">{audience.name}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusBadgeColor(audience.status)}>
                      {audience.status.charAt(0).toUpperCase() + audience.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getCompletedBadgeColor(audience.is_completed)}>
                      {audience.is_completed ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(audience.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(audience.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    {audience.status === "inactive" && (
                      <button
                        onClick={() => setShowDeleteConfirm({ type: "audience", id: audience.audience_id, name: audience.name })}
                        disabled={deletingRecord}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>

                {expandedAudienceId === audience.audience_id && (
                  <tr className="border-t bg-gray-50">
                    <td colSpan={8} className="px-8 py-6">
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-900">
                          Channels ({audience.channels.length})
                        </h5>
                        
                        {audience.channels.length > 0 ? (
                          <div className="overflow-x-auto border rounded-lg bg-white">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <tr>
                                  <th className="px-4 py-3">Channel ID</th>
                                  <th className="px-4 py-3">Name</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3">Completed</th>
                                  <th className="px-4 py-3">Created At</th>
                                  <th className="px-4 py-3">Updated At</th>
                                  <th className="px-4 py-3">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {audience.channels.map((channel) => (
                                  <tr key={channel.channel_id} className="border-b last:border-b-0 hover:bg-white/50">
                                    <td className="px-4 py-3 text-sm text-gray-500">{channel.channel_id}</td>
                                    <td className="px-4 py-3 font-medium">{channel.name}</td>
                                    <td className="px-4 py-3">
                                      <Badge className={channel.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                        {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <Badge className={getCompletedBadgeColor(channel.is_completed)}>
                                        {channel.is_completed ? "Yes" : "No"}
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
                                          onClick={() => setShowDeleteConfirm({ type: "channel", id: channel.channel_id, name: channel.name })}
                                          disabled={deletingRecord}
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
                        ) : (
                          <div className="text-center py-4 text-sm text-gray-500">
                            No channels found
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={showDeleteConfirm !== null} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {showDeleteConfirm?.type === "audience" ? "Audience" : "Channel"}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold">{showDeleteConfirm?.name}</span>? This cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deletingRecord ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
