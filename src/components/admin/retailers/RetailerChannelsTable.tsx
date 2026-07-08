"use client";

import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
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
import { Fragment, useState } from "react";
import { Channel, DistributionCenter, InventoryUser } from "./types";

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadgeColor(status?: string | null) {
  return status?.toLowerCase() === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
}

function getCompletedBadgeColor(isCompleted: boolean) {
  return isCompleted
    ? "bg-blue-100 text-blue-800"
    : "bg-gray-100 text-gray-800";
}

function formatStatus(status?: string | null) {
  if (!status) {
    return "-";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatAllocation(value?: number | string | null) {
  if (value == null || value === "") {
    return "-";
  }

  if (typeof value === "string") {
    return value.includes("%") ? value : `${value}%`;
  }

  return `${value}%`;
}

function getDistributionCenterId(distributionCenter: DistributionCenter, index: number) {
  return (
    distributionCenter.distribution_center_id ||
    distributionCenter.distribution_center_salesforce_id ||
    distributionCenter.distribution_center_name ||
    distributionCenter.name ||
    `distribution-center-${index}`
  );
}

function getDistributionCenterName(distributionCenter: DistributionCenter) {
  return distributionCenter.distribution_center_name || distributionCenter.name || "-";
}

function normalizeInventoryUser(distributionCenter: DistributionCenter) {
  const user =
    distributionCenter.inventory_user ||
    distributionCenter.inventoryUser ||
    distributionCenter.inventory_contact ||
    null;

  if (!user) {
    return null;
  }

  const name =
    user.name ||
    [user.first_name || user.FirstName, user.last_name || user.LastName]
      .filter(Boolean)
      .join(" ")
      .trim();
  const email = user.email || user.Email;
  const phone = user.phone || user.Phone;
  const status = user.status;
  const updatedAt = user.updated_at;

  if (!name && !email && !phone && !status && !updatedAt) {
    return null;
  }

  return {
    name: name || "-",
    email: email || "-",
    phone: phone || "-",
    status: status || "",
    updated_at: updatedAt || "",
  };
}

function InventoryUserDetails({ user }: { user: InventoryUser | null }) {
  if (!user) {
    return (
      <div className="text-sm text-gray-500">
        No inventory user assigned
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated At</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-4 py-3">{user.name || "-"}</td>
            <td className="px-4 py-3">{user.email || "-"}</td>
            <td className="px-4 py-3">{user.phone || "-"}</td>
            <td className="px-4 py-3">
              {user.status ? (
                <Badge className={getStatusBadgeColor(user.status)}>
                  {formatStatus(user.status)}
                </Badge>
              ) : (
                "-"
              )}
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(user.updated_at)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function RetailerChannelsTable({
  channels,
  onDeleted,
}: {
  channels: Channel[];
  onDeleted: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ channel_id: string; name: string } | null>(null);
  const [expandedChannels, setExpandedChannels] = useState<Record<string, boolean>>({});
  const [expandedDistributionCenters, setExpandedDistributionCenters] = useState<Record<string, boolean>>({});

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

  const toggleChannel = (channelId: string) => {
    setExpandedChannels((current) => ({
      ...current,
      [channelId]: !current[channelId],
    }));
  };

  const toggleDistributionCenter = (distributionCenterId: string) => {
    setExpandedDistributionCenters((current) => ({
      ...current,
      [distributionCenterId]: !current[distributionCenterId],
    }));
  };

  return (
    <>
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 w-8"></th>
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
            {channels.map((channel) => {
              const distributionCenters = channel.distribution_centers ?? [];

              return (
                <Fragment key={channel.channel_id}>
                  <tr className="border-b hover:bg-white/50">
                    <td className="px-4 py-3 align-top">
                      <button
                        onClick={() => toggleChannel(channel.channel_id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                        aria-label={expandedChannels[channel.channel_id] ? "Collapse channel" : "Expand channel"}
                      >
                        {expandedChannels[channel.channel_id] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{channel.channel_id}</td>
                    <td className="px-4 py-3 font-medium">{channel.name}</td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusBadgeColor(channel.status)}>
                        {formatStatus(channel.status)}
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
                      {channel.status?.toLowerCase() === "inactive" && (
                        <button
                          onClick={() => setShowDeleteConfirm({ channel_id: channel.channel_id, name: channel.name })}
                          disabled={deletingChannel}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          aria-label={`Delete ${channel.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>

                  {expandedChannels[channel.channel_id] && (
                    <tr className="border-b bg-gray-50">
                      <td colSpan={8} className="px-8 py-6">
                        <div className="space-y-3">
                          <h6 className="font-semibold text-gray-900">
                            Distribution Centers ({distributionCenters.length})
                          </h6>

                          {distributionCenters.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border bg-white">
                              <table className="w-full min-w-[1400px] text-sm">
                                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  <tr>
                                    <th className="px-4 py-3 w-8"></th>
                                    <th className="px-4 py-3">Distribution Center ID</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Allocation %</th>
                                    <th className="px-4 py-3">Ship To Name</th>
                                    <th className="px-4 py-3">Shipping Address 1</th>
                                    <th className="px-4 py-3">Shipping Address 2</th>
                                    <th className="px-4 py-3">City</th>
                                    <th className="px-4 py-3">State</th>
                                    <th className="px-4 py-3">Zip Code</th>
                                    <th className="px-4 py-3">Shipping Instructions</th>
                                    <th className="px-4 py-3">Updated At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {distributionCenters.map((distributionCenter, index) => {
                                    const distributionCenterId = getDistributionCenterId(distributionCenter, index);
                                    const inventoryUser = normalizeInventoryUser(distributionCenter);

                                    return (
                                      <Fragment key={distributionCenterId}>
                                        <tr className="border-b last:border-b-0 hover:bg-white/70">
                                          <td className="px-4 py-3 align-top">
                                            <button
                                              onClick={() => toggleDistributionCenter(distributionCenterId)}
                                              className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                                              aria-label={expandedDistributionCenters[distributionCenterId] ? "Collapse distribution center" : "Expand distribution center"}
                                            >
                                              {expandedDistributionCenters[distributionCenterId] ? (
                                                <ChevronUp size={18} />
                                              ) : (
                                                <ChevronDown size={18} />
                                              )}
                                            </button>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-500">{distributionCenter.distribution_center_id || distributionCenter.distribution_center_salesforce_id || "-"}</td>
                                          <td className="px-4 py-3 font-medium">{getDistributionCenterName(distributionCenter)}</td>
                                          <td className="px-4 py-3">
                                            {distributionCenter.status ? (
                                              <Badge className={getStatusBadgeColor(distributionCenter.status)}>
                                                {formatStatus(distributionCenter.status)}
                                              </Badge>
                                            ) : (
                                              "-"
                                            )}
                                          </td>
                                          <td className="px-4 py-3">{formatAllocation(distributionCenter.allocation_percentage)}</td>
                                          <td className="px-4 py-3">{distributionCenter.ship_to_name || "-"}</td>
                                          <td className="px-4 py-3">{distributionCenter.shipping_address_1 || "-"}</td>
                                          <td className="px-4 py-3">{distributionCenter.shipping_address_2 || "-"}</td>
                                          <td className="px-4 py-3">{distributionCenter.city || "-"}</td>
                                          <td className="px-4 py-3">{distributionCenter.state || "-"}</td>
                                          <td className="px-4 py-3">{distributionCenter.zip_code || "-"}</td>
                                          <td className="px-4 py-3">{distributionCenter.shipping_instructions || "-"}</td>
                                          <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDate(distributionCenter.updated_at)}
                                          </td>
                                        </tr>

                                        {expandedDistributionCenters[distributionCenterId] && (
                                          <tr className="border-b bg-gray-50">
                                            <td colSpan={13} className="px-8 py-4">
                                              <div className="space-y-3 rounded-lg border bg-white p-4">
                                                <h6 className="font-semibold text-gray-900">
                                                  Inventory User Details
                                                </h6>
                                                <InventoryUserDetails user={inventoryUser} />
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              No distribution centers found
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
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
