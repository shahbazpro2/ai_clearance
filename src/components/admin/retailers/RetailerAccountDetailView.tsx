"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { syncSpecificSalesforceRetailerApi } from "@/api/admin";
import { ArrowLeft, Building2, ChevronRight, CircleDot, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "use-hook-api";
import { RetailerUsersTable } from "./RetailerUsersTable";
import {
  Audience,
  DistributionCenter,
  InventoryUser,
  RetailerAccount,
} from "./types";

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

function formatDateTime(dateString?: string | null) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status?: string | null) {
  if (!status) {
    return "-";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusBadgeColor(status?: string | null) {
  return status?.toLowerCase() === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
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

function normalizeInventoryUser(distributionCenter?: DistributionCenter | null) {
  if (!distributionCenter) {
    return null;
  }

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

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm font-medium leading-6 text-gray-900 break-words">
        {value || "-"}
      </div>
    </div>
  );
}

function InventoryUserPanel({ user }: { user: InventoryUser | null }) {
  return (
    <div className="space-y-4">
      <h4 className="text-base font-semibold text-gray-900">Inventory User</h4>
      {user ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
                <td className="px-4 py-4 font-medium text-gray-900">{user.name || "-"}</td>
                <td className="px-4 py-4 text-blue-600">{user.email || "-"}</td>
                <td className="px-4 py-4">{user.phone || "-"}</td>
                <td className="px-4 py-3">
                  {user.status ? (
                    <Badge className={getStatusBadgeColor(user.status)}>
                      {formatStatus(user.status)}
                    </Badge>
                  ) : (
                    "Unassigned"
                  )}
                </td>
                <td className="px-4 py-4 text-gray-600">{formatDateTime(user.updated_at)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed px-5 py-8 text-sm text-gray-500">
          No inventory user assigned
        </div>
      )}
    </div>
  );
}

export function RetailerAccountDetailView({
  account,
  onBack,
  onDeleted,
}: {
  account: RetailerAccount;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "audiences">("audiences");
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(
    account.audiences[0]?.audience_id ?? null
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    account.audiences[0]?.channels[0]?.channel_id ?? null
  );
  const [distributionCentersDrawerOpen, setDistributionCentersDrawerOpen] = useState(false);
  const [selectedDistributionCenterId, setSelectedDistributionCenterId] = useState<string | null>(
    account.audiences[0]?.channels[0]?.distribution_centers?.[0]?.distribution_center_id ||
    account.audiences[0]?.channels[0]?.distribution_centers?.[0]?.distribution_center_salesforce_id ||
    null
  );

  const [syncUsers, { loading: syncingUsers }] = useApi({
    both: true,
    resSuccessMsg: "Users synced successfully",
  });

  const selectedAudience = useMemo(() => {
    return account.audiences.find((audience) => audience.audience_id === selectedAudienceId) || null;
  }, [account.audiences, selectedAudienceId]);

  const selectedChannel = useMemo(() => {
    if (!selectedAudience) {
      return null;
    }

    return selectedAudience.channels.find((channel) => channel.channel_id === selectedChannelId) || null;
  }, [selectedAudience, selectedChannelId]);

  const selectedDistributionCenter = useMemo(() => {
    const distributionCenters = selectedChannel?.distribution_centers ?? [];

    return (
      distributionCenters.find((distributionCenter, index) => {
        return getDistributionCenterId(distributionCenter, index) === selectedDistributionCenterId;
      }) || distributionCenters[0] || null
    );
  }, [selectedChannel, selectedDistributionCenterId]);

  const selectedInventoryUser = useMemo(
    () => normalizeInventoryUser(selectedDistributionCenter),
    [selectedDistributionCenter]
  );

  useEffect(() => {
    const nextAudience = account.audiences.find((audience) => audience.audience_id === selectedAudienceId) || account.audiences[0] || null;
    if (!nextAudience) {
      setSelectedAudienceId(null);
      setSelectedChannelId(null);
      setSelectedDistributionCenterId(null);
      return;
    }

    if (nextAudience.audience_id !== selectedAudienceId) {
      setSelectedAudienceId(nextAudience.audience_id);
      return;
    }

    const nextChannel =
      nextAudience.channels.find((channel) => channel.channel_id === selectedChannelId) ||
      nextAudience.channels[0] ||
      null;

    if (!nextChannel) {
      setSelectedChannelId(null);
      setSelectedDistributionCenterId(null);
      return;
    }

    if (nextChannel.channel_id !== selectedChannelId) {
      setSelectedChannelId(nextChannel.channel_id);
      return;
    }

    const distributionCenters = nextChannel.distribution_centers ?? [];
    const nextDistributionCenter =
      distributionCenters.find((distributionCenter, index) => {
        return getDistributionCenterId(distributionCenter, index) === selectedDistributionCenterId;
      }) ||
      distributionCenters[0] ||
      null;

    const nextDistributionCenterId = nextDistributionCenter
      ? getDistributionCenterId(nextDistributionCenter, distributionCenters.indexOf(nextDistributionCenter))
      : null;

    if (nextDistributionCenterId !== selectedDistributionCenterId) {
      setSelectedDistributionCenterId(nextDistributionCenterId);
    }
  }, [account.audiences, selectedAudienceId, selectedChannelId, selectedDistributionCenterId]);

  const handleSyncUsers = () => {
    syncUsers(syncSpecificSalesforceRetailerApi({ account_id: account.account_id }));
  };

  const handleOpenDistributionCenters = (channelId: string) => {
    setSelectedChannelId(channelId);
    setDistributionCentersDrawerOpen(true);
  };

  const renderOverview = () => {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-3 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{account.users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Total Audiences</CardDescription>
            <CardTitle className="text-2xl">{account.audiences.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="gap-3 py-5">
          <CardHeader className="pb-0">
            <CardDescription>Total Channels</CardDescription>
            <CardTitle className="text-2xl">
              {account.audiences.reduce((total, audience) => total + audience.channels.length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  };

  const renderAudienceSummary = (audience: Audience) => {
    return (
      <Card className="gap-4 py-5">
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardDescription>Audience</CardDescription>
                <CardTitle className="text-xl">{audience.name}</CardTitle>
              </div>
            </div>
            <Badge className={getStatusBadgeColor(audience.status)}>
              {formatStatus(audience.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-gray-600 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Channels</div>
            <div className="mt-1 font-medium text-gray-900">{audience.channels.length}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Completed</div>
            <div className="mt-1 font-medium text-gray-900">{audience.is_completed ? "Yes" : "No"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Created At</div>
            <div className="mt-1 font-medium text-gray-900">{formatDate(audience.created_at)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Updated At</div>
            <div className="mt-1 font-medium text-gray-900">{formatDate(audience.updated_at)}</div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAudiences = () => {
    return (
      <>
        <div className="space-y-6">
          {account.audiences.length > 1 && (
            <Card className="gap-4 py-5">
              <CardHeader className="pb-0">
                <CardTitle className="text-base">Audiences</CardTitle>
                <CardDescription>Select an audience to inspect its channels.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {account.audiences.map((audience) => (
                  <Button
                    key={audience.audience_id}
                    variant={selectedAudienceId === audience.audience_id ? "default" : "outline"}
                    onClick={() => setSelectedAudienceId(audience.audience_id)}
                  >
                    {audience.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedAudience ? (
            <>
              {renderAudienceSummary(selectedAudience)}

              <Card className="gap-4 py-5">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Channels</CardTitle>
                  <CardDescription>Channels associated with this audience.</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedAudience.channels.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Channel Name</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Updated At</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAudience.channels.map((channel) => (
                            <tr
                              key={channel.channel_id}
                              className={`border-t ${selectedChannelId === channel.channel_id ? "bg-violet-50" : "hover:bg-gray-50"
                                }`}
                            >
                              <td className="px-4 py-3 font-medium text-gray-900">{channel.name}</td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusBadgeColor(channel.status)}>
                                  {formatStatus(channel.status)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{formatDate(channel.updated_at)}</td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant={selectedChannelId === channel.channel_id ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleOpenDistributionCenters(channel.channel_id)}
                                >
                                  View Distribution Centers
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-gray-500">
                      No channels found for this audience.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="gap-4 py-10">
              <CardContent className="text-sm text-gray-500">
                No audiences found for this account.
              </CardContent>
            </Card>
          )}
        </div>

        <Sheet open={distributionCentersDrawerOpen} onOpenChange={setDistributionCentersDrawerOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
            <SheetHeader className="border-b pb-4">
              <SheetTitle className="text-xl">Distribution Centers</SheetTitle>
              <SheetDescription>
                {selectedChannel ? (
                  <>
                    Channel: <span className="font-medium text-violet-600">{selectedChannel.name}</span>
                  </>
                ) : (
                  "Select a channel to inspect distribution centers."
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 p-4">
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50/40 p-5">
                <div className="text-base font-semibold text-gray-900">
                  Distribution Centers ({selectedChannel?.distribution_centers?.length ?? 0})
                </div>

                {selectedChannel?.distribution_centers?.length ? (
                  <div className="space-y-3">
                    {selectedChannel.distribution_centers.map((distributionCenter, index) => {
                      const distributionCenterId = getDistributionCenterId(distributionCenter, index);
                      const isSelected = distributionCenterId === selectedDistributionCenterId;

                      return (
                        <button
                          key={distributionCenterId}
                          onClick={() => setSelectedDistributionCenterId(distributionCenterId)}
                          className={`flex w-full items-start justify-between rounded-xl border px-4 py-4 text-left transition-colors ${isSelected
                            ? "border-violet-300 bg-violet-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <CircleDot className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? "text-violet-600" : "text-gray-300"}`} />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-gray-900">
                                {getDistributionCenterName(distributionCenter)}
                              </div>
                              <div className="mt-1 text-xs leading-5 text-gray-500">
                                {distributionCenter.city || "-"}, {distributionCenter.state || "-"}
                              </div>
                              <div className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                                Distribution Center
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
                            <span className="text-sm font-semibold text-gray-700">
                              {formatAllocation(distributionCenter.allocation_percentage)}
                            </span>
                            <Badge className={getStatusBadgeColor(distributionCenter.status)}>
                              {formatStatus(distributionCenter.status)}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed bg-white px-5 py-8 text-sm text-gray-500">
                    No distribution centers available for this channel.
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-900">Distribution Center Details</div>
                    <div className="mt-1 text-sm text-gray-500">
                      {selectedDistributionCenter
                        ? getDistributionCenterName(selectedDistributionCenter)
                        : "Select a distribution center to view its details."}
                    </div>
                  </div>
                  {selectedDistributionCenter?.status ? (
                    <Badge className={getStatusBadgeColor(selectedDistributionCenter.status)}>
                      {formatStatus(selectedDistributionCenter.status)}
                    </Badge>
                  ) : null}
                </div>
                {selectedDistributionCenter ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailField
                      label="Distribution Center ID"
                      value={
                        selectedDistributionCenter.distribution_center_id ||
                        selectedDistributionCenter.distribution_center_salesforce_id ||
                        "-"
                      }
                    />
                    <DetailField label="Name" value={getDistributionCenterName(selectedDistributionCenter)} />
                    <DetailField label="Status" value={formatStatus(selectedDistributionCenter.status)} />
                    <DetailField
                      label="Allocation %"
                      value={formatAllocation(selectedDistributionCenter.allocation_percentage)}
                    />
                    <DetailField label="Ship To Name" value={selectedDistributionCenter.ship_to_name || "-"} />
                    <DetailField
                      label="Shipping Address 1"
                      value={selectedDistributionCenter.shipping_address_1 || "-"}
                    />
                    <DetailField
                      label="Shipping Address 2"
                      value={selectedDistributionCenter.shipping_address_2 || "-"}
                    />
                    <DetailField label="City" value={selectedDistributionCenter.city || "-"} />
                    <DetailField label="State" value={selectedDistributionCenter.state || "-"} />
                    <DetailField label="Zip Code" value={selectedDistributionCenter.zip_code || "-"} />
                    <DetailField
                      label="Shipping Instructions"
                      value={selectedDistributionCenter.shipping_instructions || "-"}
                    />
                    <DetailField
                      label="Updated At"
                      value={formatDateTime(selectedDistributionCenter.updated_at)}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-5 py-8 text-sm text-gray-500">
                    Select a distribution center to view its details.
                  </div>
                )}
              </div>

              <Separator />

              <InventoryUserPanel user={selectedInventoryUser} />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <button onClick={onBack} className="font-medium text-violet-600 hover:text-violet-700">
          Retailers Management
        </button>
        <ChevronRight className="h-4 w-4" />
        <span>{account.account_name}</span>
        {selectedAudience && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span>{selectedAudience.name}</span>
          </>
        )}
        {selectedChannel && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span>{selectedChannel.name}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-3">
            <ArrowLeft className="h-4 w-4" />
            Back To Accounts
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{account.account_name}</h1>
        </div>

        <Button onClick={handleSyncUsers} disabled={syncingUsers}>
          {syncingUsers ? "Syncing..." : "Sync Record"}
        </Button>
      </div>

      <Card className="gap-4 py-5">
        <CardHeader className="pb-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <CardDescription>Account Details</CardDescription>
                <CardTitle className="text-2xl">{account.account_name}</CardTitle>
              </div>
            </div>
            <Badge className={getStatusBadgeColor(account.status)}>
              {formatStatus(account.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-gray-600 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Account ID</div>
            <div className="mt-1 font-medium text-gray-900">{account.account_id}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Created At</div>
            <div className="mt-1 font-medium text-gray-900">{formatDate(account.created_at)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Updated At</div>
            <div className="mt-1 font-medium text-gray-900">{formatDate(account.updated_at)}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4 py-5">
        <CardHeader className="pb-0">
          <div className="flex gap-2 border-b">
            {(["overview", "users", "audiences"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab
                  ? "border-b-2 border-violet-600 text-violet-700"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "users" && (
            <RetailerUsersTable
              users={account.users}
              onSyncUsers={handleSyncUsers}
              syncingUsers={syncingUsers}
              onDeleted={onDeleted}
            />
          )}
          {activeTab === "audiences" && renderAudiences()}
        </CardContent>
      </Card>
    </div>
  );
}
