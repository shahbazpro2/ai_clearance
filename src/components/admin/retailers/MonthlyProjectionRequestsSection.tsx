"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchMonthlyProjectionRequestsApi,
    updateProjectionRequestStatusApi,
} from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RefreshCw, Eye } from "lucide-react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectionChange {
    projection_month: string;
    current_projection: number;
    requested_projection: number;
}

interface ProjectionRequest {
    request_id: string;
    status: string;
    updated_at: string;
    changes: ProjectionChange[];
}

interface ProjectionChannel {
    channel_type: string;
    requests: ProjectionRequest[];
}

interface ProjectionAudience {
    audience_name: string;
    channels: ProjectionChannel[];
}

interface FlatRow {
    audience_name: string;
    channel_type: string;
    request_id: string;
    status: string;
    updated_at: string;
    changes: ProjectionChange[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RequestStatus = "pending" | "approved" | "rejected";

function formatDateTime(dateString?: string | null): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatNumber(value: number): string {
    return value.toLocaleString("en-US");
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
    switch (status.toLowerCase()) {
        case "approved":
            return { backgroundColor: "#dcfce7", color: "#166534", borderColor: "#86efac" };
        case "rejected":
            return { backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" };
        case 'reviewed':
            return {
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                borderColor: "#93c5fd",
            };
        case "pending":
        default:
            return { backgroundColor: "#fef9c3", color: "#854d0e", borderColor: "#fde047" };
    }
}

function flattenAudiences(audiences: ProjectionAudience[]): FlatRow[] {
    const rows: FlatRow[] = [];
    for (const audience of audiences) {
        for (const channel of audience.channels) {
            for (const request of channel.requests) {
                rows.push({
                    audience_name: audience.audience_name,
                    channel_type: channel.channel_type,
                    request_id: request.request_id,
                    status: request.status,
                    updated_at: request.updated_at,
                    changes: request.changes,
                });
            }
        }
    }
    return rows;
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function ProjectionRequestDrawer({
    row,
    open,
    onClose,
    onStatusUpdated,
}: {
    row: FlatRow | null;
    open: boolean;
    onClose: () => void;
    onStatusUpdated: () => void;
}) {
    const [updateStatus, { loading: updating }] = useApi({
        both: true,
    });

    const handleUpdate = async (status: number) => {
        if (!row) return;
        try {
            await updateStatus(
                updateProjectionRequestStatusApi({ request_id: row.request_id, status }),
            );
            toast.success(
                `Request ${status === 1 ? "approved" : "rejected"} successfully`,
            );
            onStatusUpdated();
            onClose();
        } catch {
            toast.error("Failed to update request status");
        }
    };

    if (!row) return null;

    const isPending = row.status.toLowerCase() === "pending";

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
                <SheetHeader className="border-b pb-4">
                    <SheetTitle className="text-xl">Projection Request Details</SheetTitle>
                    <SheetDescription>
                        Review the monthly projection change request and update its status.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 p-4">
                    {/* Meta fields */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailField label="Audience" value={row.audience_name} />
                        <DetailField label="Channel" value={row.channel_type} />
                        <DetailField
                            label="Status"
                            value=""
                            renderValue={
                                <Badge variant="outline" style={getStatusBadgeStyle(row.status)}>
                                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                </Badge>
                            }
                        />
                        <DetailField
                            label="Updated At"
                            value={formatDateTime(row.updated_at)}
                        />
                        <DetailField
                            label="Request ID"
                            value={row.request_id}
                            className="sm:col-span-2 break-all"
                        />
                    </div>

                    {/* Changes table */}
                    <div className="space-y-3">
                        <h4 className="text-base font-semibold text-gray-900">
                            Monthly Projection Changes
                        </h4>
                        {row.changes.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">Month</th>
                                            <th className="px-4 py-3">Current Projection</th>
                                            <th className="px-4 py-3">Requested Projection</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {row.changes.map((change, idx) => (
                                            <tr
                                                key={`${change.projection_month}-${idx}`}
                                                className="border-t"
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {change.projection_month}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {formatNumber(change.current_projection)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {formatNumber(change.requested_projection)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed px-5 py-8 text-sm text-gray-500">
                                No projection changes found.
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {isPending && (
                        <div className="flex gap-3 pt-2">
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={updating}
                                onClick={() => handleUpdate(1)}
                            >
                                {updating && <LoadingSpinner size="sm" />}
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={updating}
                                onClick={() => handleUpdate(0)}
                            >
                                {updating && <LoadingSpinner size="sm" />}
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function DetailField({
    label,
    value,
    renderValue,
    className,
}: {
    label: string;
    value: string;
    renderValue?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-xl border border-gray-200 bg-gray-50/70 p-4 ${className ?? ""}`}
        >
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </div>
            {renderValue ? (
                renderValue
            ) : (
                <div className="text-sm font-medium leading-6 text-gray-900 break-words">
                    {value || "-"}
                </div>
            )}
        </div>
    );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function MonthlyProjectionRequestsSection() {
    const [mounted, setMounted] = useState(false);
    const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
    const [selectedRow, setSelectedRow] = useState<FlatRow | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [getRequests, { data, loading, apiLoading, error }] = useApi({
        cache: "monthly-projection-requests",
    });

    const getRequestsRef = useRef(getRequests);
    getRequestsRef.current = getRequests;

    const fetchData = useCallback(() => {
        const params =
            statusFilter !== "all" ? { status: statusFilter as RequestStatus } : undefined;
        getRequestsRef.current(fetchMonthlyProjectionRequestsApi(params));
    }, [statusFilter]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        fetchData();
    }, [fetchData, mounted]);

    if (!mounted) return null;

    const audiences: ProjectionAudience[] = Array.isArray(data?.audiences)
        ? data.audiences
        : [];

    const rows = flattenAudiences(audiences);

    const handleViewDetails = (row: FlatRow) => {
        setSelectedRow(row);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedRow(null);
    };

    return (
        <section className="space-y-4">
            {/* Section header */}
            <h2 className="text-xl font-bold text-gray-900">
                Monthly Projection Requests
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as RequestStatus | "all")}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    disabled={apiLoading}
                    aria-label="Refresh projection requests"
                >
                    <RefreshCw className={`h-4 w-4 ${apiLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Channel</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Changes</th>
                                <th className="px-4 py-3">Updated At</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                                            <LoadingSpinner size="lg" />
                                            Loading projection requests…
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && error && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-red-600 text-sm">
                                        Failed to load projection requests.
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                                        No projection requests found.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                !error &&
                                rows.map((row) => (
                                    <tr
                                        key={row.request_id}
                                        className="border-t transition-colors hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {row.channel_type}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" style={getStatusBadgeStyle(row.status)}>
                                                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {row.changes.length}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {formatDateTime(row.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewDetails(row)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail drawer */}
            <ProjectionRequestDrawer
                row={selectedRow}
                open={drawerOpen}
                onClose={handleCloseDrawer}
                onStatusUpdated={fetchData}
            />
        </section>
    );
}
