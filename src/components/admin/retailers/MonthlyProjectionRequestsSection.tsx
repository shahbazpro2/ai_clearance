"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    fetchMonthlyProjectionRequestsApi,
    updateProjectionRequestStatusApi,
    type MonthEditPayload,
} from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { RefreshCw, Eye, Pencil, RotateCcw } from "lucide-react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectionChange {
    projection_month: string;
    current_projection: number;
    requested_projection: number;
    approved_projection?: number | null;
}

interface ProjectionRequest {
    request_id: string;
    status: string;
    updated_at: string;
    message?: string;
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
    message?: string;
    changes: ProjectionChange[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RequestStatus = "pending" | "approved" | "approved_with_edits" | "rejected";

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

function formatNumber(value?: number | null): string {
    return (value ?? 0).toLocaleString("en-US");
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
    switch (status.toLowerCase()) {
        case "approved":
        case "approved_with_edits":
            return { backgroundColor: "#dcfce7", color: "#166534", borderColor: "#86efac" };
        case "rejected":
            return { backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" };
        case "reviewed":
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

function formatStatusLabel(status: string): string {
    if (!status) return "";
    if (status.toLowerCase() === "approved_with_edits") return "Approved with Edits";
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
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
                    message: request.message,
                    changes: request.changes,
                });
            }
        }
    }
    return rows;
}

const validateProjectionValue = (val: string | undefined): string | null => {
    if (val === undefined || val === null || val.trim() === "") {
        return "Value must be a multiple of 25,000";
    }
    const num = Number(val);
    if (
        Number.isNaN(num) ||
        num < 0 ||
        !Number.isInteger(num) ||
        num % 25000 !== 0
    ) {
        return "Value must be a multiple of 25,000";
    }
    return null;
};

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
        errMsg: true,
    });

    // Global edit state for the table
    const [isEditing, setIsEditing] = useState(false);
    const [editedProjections, setEditedProjections] = useState<Record<string, string>>({});
    const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

    // Admin message for "Approve with Edits"
    const [adminMessage, setAdminMessage] = useState("");
    const [adminMessageError, setAdminMessageError] = useState("");

    // Rejection state
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectionError, setRejectionError] = useState("");

    // Reset state whenever the drawer opens or row changes
    useEffect(() => {
        setIsEditing(false);
        setEditedProjections({});
        setInputErrors({});
        setAdminMessage("");
        setAdminMessageError("");
        setIsRejecting(false);
        setRejectionReason("");
        setRejectionError("");
    }, [row?.request_id, open]);

    // Compute modified months (treated as approved_projection)
    const modifiedMonths: MonthEditPayload[] = useMemo(() => {
        if (!row) return [];
        const edits: MonthEditPayload[] = [];
        for (const change of row.changes) {
            const raw = editedProjections[change.projection_month];
            if (raw !== undefined && raw.trim() !== "") {
                const parsed = Number(raw);
                if (!Number.isNaN(parsed) && parsed !== change.requested_projection) {
                    edits.push({
                        projection_month: change.projection_month,
                        approved_projection: parsed,
                    });
                }
            }
        }
        return edits;
    }, [row, editedProjections]);

    const hasEdits = modifiedMonths.length > 0;

    const hasAnyInvalidInput = useMemo(() => {
        return Object.keys(inputErrors).length > 0;
    }, [inputErrors]);

    if (!row) return null;

    const isPending = row.status.toLowerCase() === "pending";

    const handleToggleGlobalEdit = () => {
        if (isEditing) {
            // Validate and exit edit mode
            const errors: Record<string, string> = {};
            for (const change of row.changes) {
                const m = change.projection_month;
                const raw = editedProjections[m];
                if (raw !== undefined) {
                    const err = validateProjectionValue(raw);
                    if (err) {
                        errors[m] = err;
                    }
                }
            }
            if (Object.keys(errors).length > 0) {
                setInputErrors(errors);
                return;
            }
            setInputErrors({});
            setIsEditing(false);
            return;
        }

        // Enable editing for all months in the table
        const nextProjections: Record<string, string> = { ...editedProjections };
        const errors: Record<string, string> = {};
        for (const change of row.changes) {
            if (nextProjections[change.projection_month] === undefined) {
                nextProjections[change.projection_month] = String(change.requested_projection);
            }
            const val = nextProjections[change.projection_month];
            const err = validateProjectionValue(val);
            if (err) {
                errors[change.projection_month] = err;
            }
        }
        setEditedProjections(nextProjections);
        setInputErrors(errors);
        setIsEditing(true);
        if (isRejecting) {
            setIsRejecting(false);
            setRejectionError("");
        }
    };

    // 1. & 3. Handle Approve (Standard or With Edits)
    const handleApproveSubmit = () => {
        if (!row) return;

        // Validate any active inputs
        const errors: Record<string, string> = {};
        for (const change of row.changes) {
            const raw = editedProjections[change.projection_month];
            if (raw !== undefined) {
                const err = validateProjectionValue(raw);
                if (err) {
                    errors[change.projection_month] = err;
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setInputErrors(errors);
            toast.error("Value must be a multiple of 25,000");
            return;
        }

        // Workflow 3: Approve with Edits (status: 2)
        if (hasEdits) {
            if (!adminMessage.trim()) {
                setAdminMessageError("Admin message is required when modifying projections.");
                toast.error("Please enter an Admin Message before submitting edits.");
                return;
            }

            updateStatus(
                updateProjectionRequestStatusApi({
                    request_id: row.request_id,
                    status: 2,
                    message: adminMessage.trim(),
                    month_edits: modifiedMonths,
                }),
                () => {
                    toast.success("Request approved with edits successfully");
                    onStatusUpdated();
                    onClose();
                },
            );
            return;
        }

        // Workflow 1: Standard Approve (status: 1)
        updateStatus(
            updateProjectionRequestStatusApi({
                request_id: row.request_id,
                status: 1,
            }),
            () => {
                toast.success("Request approved successfully");
                onStatusUpdated();
                onClose();
            },
        );
    };

    // 2. Handle Reject (status: 0)
    const handleRejectSubmit = () => {
        if (!row) return;

        if (!rejectionReason.trim()) {
            setRejectionError("Rejection reason is required.");
            toast.error("Please provide a rejection reason before submitting.");
            return;
        }

        updateStatus(
            updateProjectionRequestStatusApi({
                request_id: row.request_id,
                status: 0,
                message: rejectionReason.trim(),
            }),
            () => {
                toast.success("Request rejected successfully");
                onStatusUpdated();
                onClose();
            },
        );
    };

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
                                    {formatStatusLabel(row.status)}
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
                        {row.message && (
                            <DetailField
                                label="Message / Notes"
                                value={row.message}
                                className="sm:col-span-2"
                            />
                        )}
                    </div>

                    {/* Changes table */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold text-gray-900">
                                Monthly Projection Changes
                            </h4>
                            {isPending && hasEdits && (
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                    {modifiedMonths.length} modified month{modifiedMonths.length === 1 ? "" : "s"}
                                </span>
                            )}
                        </div>

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
                                        {row.changes.map((change, idx) => {
                                            const month = change.projection_month;
                                            const rawVal = editedProjections[month];
                                            const isModified =
                                                rawVal !== undefined &&
                                                rawVal.trim() !== "" &&
                                                Number(rawVal) !== change.requested_projection;
                                            const inputError = inputErrors[month];

                                            return (
                                                <tr
                                                    key={`${month}-${idx}`}
                                                    className="border-t transition-colors hover:bg-gray-50/70"
                                                >
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        {month}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {formatNumber(change.current_projection)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {/* Non-pending view */}
                                                        {!isPending && (
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-900 font-medium">
                                                                    {formatNumber(change.requested_projection)}
                                                                </span>
                                                                {change.approved_projection !== undefined &&
                                                                    change.approved_projection !== null &&
                                                                    change.approved_projection !== change.requested_projection && (
                                                                        <span className="text-xs text-blue-600 font-medium mt-0.5">
                                                                            Approved: {formatNumber(change.approved_projection)}
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        )}

                                                        {/* Pending view - Editable Input (when global Edit is active) */}
                                                        {isPending && isEditing && (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="25000"
                                                                        value={rawVal ?? change.requested_projection}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            setEditedProjections((prev) => ({
                                                                                ...prev,
                                                                                [month]: val,
                                                                            }));
                                                                            const err = validateProjectionValue(val);
                                                                            setInputErrors((prev) => {
                                                                                const next = { ...prev };
                                                                                if (err) {
                                                                                    next[month] = err;
                                                                                } else {
                                                                                    delete next[month];
                                                                                }
                                                                                return next;
                                                                            });
                                                                        }}
                                                                        className={`h-8 w-36 px-2 py-1 text-sm font-semibold bg-white ${
                                                                            inputError ? "border-red-500 focus-visible:ring-red-400" : ""
                                                                        }`}
                                                                        autoFocus={idx === 0}
                                                                    />
                                                                    {isModified && (
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
                                                                            title="Reset to requested value"
                                                                            onClick={() => {
                                                                                const resetVal = String(change.requested_projection);
                                                                                setEditedProjections((prev) => ({
                                                                                    ...prev,
                                                                                    [month]: resetVal,
                                                                                }));
                                                                                const err = validateProjectionValue(resetVal);
                                                                                setInputErrors((prev) => {
                                                                                    const next = { ...prev };
                                                                                    if (err) {
                                                                                        next[month] = err;
                                                                                    } else {
                                                                                        delete next[month];
                                                                                    }
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                        >
                                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                {inputError && (
                                                                    <span className="text-[11px] text-red-600 font-medium">
                                                                        {inputError}
                                                                    </span>
                                                                )}
                                                                {isModified && (
                                                                    <span className="text-[11px] text-blue-600 font-medium">
                                                                        Requested: {formatNumber(change.requested_projection)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Pending view - Read-only Modified Value */}
                                                        {isPending && !isEditing && isModified && (
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-blue-600">
                                                                        {formatNumber(Number(rawVal))}
                                                                    </span>
                                                                    <span className="text-[11px] text-gray-400 line-through">
                                                                        {formatNumber(change.requested_projection)}
                                                                    </span>
                                                                </div>
                                                                <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0 font-medium">
                                                                    Edited
                                                                </Badge>
                                                            </div>
                                                        )}

                                                        {/* Pending view - Default Read-only Value */}
                                                        {isPending && !isEditing && !isModified && (
                                                            <span className="text-gray-900 font-medium">
                                                                {formatNumber(change.requested_projection)}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed px-5 py-8 text-sm text-gray-500">
                                No projection changes found.
                            </div>
                        )}
                    </div>

                    {/* Review Actions (Pending requests only) */}
                    {isPending && (
                        <div className="space-y-4 pt-2">
                            {/* Workflow 2: Rejection Reason Section */}
                            {isRejecting ? (
                                <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/40 p-4">
                                    <label
                                        htmlFor="rejection-reason"
                                        className="block text-sm font-semibold text-gray-900"
                                    >
                                        Rejection Reason <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        The submitter will receive this reason upon rejection.
                                    </p>
                                    <Textarea
                                        id="rejection-reason"
                                        rows={3}
                                        placeholder="Enter the rejection reason..."
                                        value={rejectionReason}
                                        onChange={(e) => {
                                            setRejectionReason(e.target.value);
                                            if (rejectionError) setRejectionError("");
                                        }}
                                        className={
                                            rejectionError
                                                ? "border-red-500 focus-visible:ring-red-400 bg-white"
                                                : "bg-white"
                                        }
                                        autoFocus
                                    />
                                    {rejectionError && (
                                        <p className="text-xs font-medium text-red-600">{rejectionError}</p>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="destructive"
                                            disabled={updating}
                                            onClick={handleRejectSubmit}
                                        >
                                            {updating && <LoadingSpinner size="sm" />}
                                            Submit Rejection
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={updating}
                                            onClick={() => {
                                                setIsRejecting(false);
                                                setRejectionError("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Workflow 3: Admin Message Section (when edits are made) */}
                                    {(hasEdits || isEditing) && (
                                        <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                                            <div className="flex items-center justify-between">
                                                <label
                                                    htmlFor="admin-message"
                                                    className="block text-sm font-semibold text-gray-900"
                                                >
                                                    Admin Message <span className="text-red-500">*</span>
                                                </label>
                                                <Badge className="bg-blue-100 text-blue-700 font-medium">
                                                    {modifiedMonths.length} month{modifiedMonths.length === 1 ? "" : "s"} edited
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Provide feedback or explanation for the modified projection values sent to the distributor.
                                            </p>
                                            <Textarea
                                                id="admin-message"
                                                rows={3}
                                                placeholder="e.g. Adjusted the forecast to align with inventory capacity..."
                                                value={adminMessage}
                                                onChange={(e) => {
                                                    setAdminMessage(e.target.value);
                                                    if (adminMessageError) setAdminMessageError("");
                                                }}
                                                className={
                                                    adminMessageError
                                                        ? "border-red-500 focus-visible:ring-red-400 bg-white"
                                                        : "bg-white"
                                                }
                                            />
                                            {adminMessageError && (
                                                <p className="text-xs font-medium text-red-600">{adminMessageError}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Primary Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            disabled={updating || hasAnyInvalidInput}
                                            onClick={handleApproveSubmit}
                                        >
                                            {updating && <LoadingSpinner size="sm" />}
                                            {hasEdits
                                                ? `Approve with Edits (${modifiedMonths.length})`
                                                : "Approve"}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={updating || (isEditing && hasAnyInvalidInput)}
                                            onClick={handleToggleGlobalEdit}
                                            className={
                                                isEditing
                                                    ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                            {isEditing ? "Done Editing" : "Edit"}
                                        </Button>

                                        <Button
                                            variant={hasEdits ? "outline" : "destructive"}
                                            className={
                                                hasEdits
                                                    ? "border-red-200 text-red-600 hover:bg-red-50"
                                                    : ""
                                            }
                                            disabled={updating}
                                            onClick={() => {
                                                setIsRejecting(true);
                                                setRejectionError("");
                                            }}
                                        >
                                            Reject
                                        </Button>

                                        {(hasEdits || isEditing) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={updating}
                                                onClick={() => {
                                                    setEditedProjections({});
                                                    setIsEditing(false);
                                                    setAdminMessage("");
                                                    setAdminMessageError("");
                                                    setInputErrors({});
                                                }}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                Reset All Edits
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
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

export interface MonthlyProjectionRequestsSectionProps {
    targetRequestId?: string | null;
    autoOpen?: boolean;
}

export function MonthlyProjectionRequestsSection({
    targetRequestId: propTargetRequestId,
    autoOpen: propAutoOpen,
}: MonthlyProjectionRequestsSectionProps = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const targetRequestId = propTargetRequestId ?? searchParams.get("request_id");
    const autoOpen =
        propAutoOpen ??
        (searchParams.get("open") === "true" ||
            (Boolean(targetRequestId) && searchParams.get("open") !== "false"));

    const [mounted, setMounted] = useState(false);
    const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
    const [selectedRow, setSelectedRow] = useState<FlatRow | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const autoOpenedIdRef = useRef<string | null>(null);
    const notFoundToastShownRef = useRef<string | null>(null);

    const [getRequests, { data, loading, apiLoading, error, onClearCaches }] = useApi({
        cache: "monthly-projection-requests",
    });

    const getRequestsRef = useRef(getRequests);
    getRequestsRef.current = getRequests;

    const fetchData = useCallback(() => {
        onClearCaches?.(["monthly-projection-requests"]);
        const params =
            statusFilter !== "all" ? { status: statusFilter as RequestStatus } : undefined;
        getRequestsRef.current(fetchMonthlyProjectionRequestsApi(params));
    }, [statusFilter, onClearCaches]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        fetchData();
    }, [fetchData, mounted]);

    const audiences: ProjectionAudience[] = useMemo(() => {
        return Array.isArray(data?.audiences) ? data.audiences : [];
    }, [data?.audiences]);

    const rows = useMemo(() => {
        return flattenAudiences(audiences);
    }, [audiences]);

    useEffect(() => {
        if (!targetRequestId) {
            autoOpenedIdRef.current = null;
        }
    }, [targetRequestId]);

    useEffect(() => {
        if (!targetRequestId || !autoOpen || loading) return;
        if (autoOpenedIdRef.current === targetRequestId) return;

        const match = rows.find((r) => r.request_id === targetRequestId);
        if (match) {
            autoOpenedIdRef.current = targetRequestId;
            setSelectedRow(match);
            setDrawerOpen(true);
        }
    }, [rows, loading, targetRequestId, autoOpen]);

    useEffect(() => {
        if (!targetRequestId || loading || !data) return;
        if (autoOpenedIdRef.current === targetRequestId) return;
        if (notFoundToastShownRef.current === targetRequestId) return;

        const match = rows.find((r) => r.request_id === targetRequestId);
        if (!match && rows.length > 0) {
            notFoundToastShownRef.current = targetRequestId;
            toast.info(`Projection request "${targetRequestId}" not found.`);
        }
    }, [rows, loading, data, targetRequestId]);

    const handleViewDetails = (row: FlatRow) => {
        setSelectedRow(row);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedRow(null);

        // Reset the URL by removing request_id and open query parameters
        if (typeof window !== "undefined") {
            const currentParams = new URLSearchParams(window.location.search);
            if (currentParams.has("request_id") || currentParams.has("open")) {
                currentParams.delete("request_id");
                currentParams.delete("open");
                const remaining = currentParams.toString();
                const newPath = remaining ? `${pathname}?${remaining}` : pathname;
                router.replace(newPath, { scroll: false });
            }
        }
    };

    const handleStatusUpdated = () => {
        onClearCaches?.(["monthly-projection-requests"]);
        fetchData();
    };

    if (!mounted) return null;

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
                        <SelectItem value="approved_with_edits">Approved with Edits</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStatusUpdated}
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
                                                {formatStatusLabel(row.status)}
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
                onStatusUpdated={handleStatusUpdated}
            />
        </section>
    );
}
