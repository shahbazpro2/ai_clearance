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
import {
    RefreshCw,
    Eye,
    Pencil,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Search,
    RotateCcw as ResetIcon,
    Layers,
    Clock,
    CheckCircle2,
    Building2,
    Calendar,
    Copy,
    Check,
    MessageSquare,
    AlertCircle,
    X,
    Tv,
    ChevronLeft,
} from "lucide-react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectionChange {
    projection_month: string;
    current_projection: number;
    requested_projection: number;
    approved_projection?: number | null;
}

export interface ApiRequest {
    request_id: string;
    status: string;
    message?: string | null;
    updated_at: string;
    changes: ProjectionChange[];
}

export interface ApiChannel {
    channel_name?: string;
    channel_type: string;
    requests: ApiRequest[];
}

export interface ApiAudience {
    audience_name: string;
    channels: ApiChannel[];
}

export interface ApiAccount {
    account_name: string;
    audiences: ApiAudience[];
}

export interface FlatRequest {
    account_name: string;
    audience_name: string;
    channel_name: string;
    channel_type: string;
    request_id: string;
    status: string;
    updated_at: string;
    message?: string | null;
    changes: ProjectionChange[];
}

export type RequestStatus = "pending" | "approved" | "approved_with_edits" | "rejected";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateString?: string | null): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return (
        date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "UTC",
        }) + " UTC"
    );
}

function formatNumber(value?: number | null): string {
    return (value ?? 0).toLocaleString("en-US");
}

function formatMoney(n?: number | null): string {
    return n === null || n === undefined ? "—" : Number(n).toLocaleString("en-US");
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
    switch (status?.toLowerCase()) {
        case "approved":
            return { backgroundColor: "#dcfff0", color: "#007949", borderColor: "#9de3be" };
        case "approved_with_edits":
            return { backgroundColor: "#e8edff", color: "#404ba5", borderColor: "#ccd3ff" };
        case "rejected":
            return { backgroundColor: "#ffebec", color: "#c32f3d", borderColor: "#ffc5cc" };
        case "pending":
        default:
            return { backgroundColor: "#fff6dd", color: "#a66200", borderColor: "#ffdc74" };
    }
}

function formatStatusLabel(status: string): string {
    if (!status) return "";
    switch (status.toLowerCase()) {
        case "approved":
            return "Approved";
        case "approved_with_edits":
            return "Approved with Edits";
        case "rejected":
            return "Rejected";
        case "pending":
            return "Pending";
        default:
            return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
    }
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
    row: FlatRequest | null;
    open: boolean;
    onClose: () => void;
    onStatusUpdated: () => void;
}) {
    // API mutation hook
    const [updateStatus, { loading: updating }] = useApi({
        errMsg: true,
    });

    // Editing states
    const [isGlobalEditing, setIsGlobalEditing] = useState(false);
    const [editingMonths, setEditingMonths] = useState<Record<string, boolean>>({});
    const [editedProjections, setEditedProjections] = useState<Record<string, string>>({});
    const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState(false);

    // Admin message for "Approve with Edits"
    const [adminMessage, setAdminMessage] = useState("");
    const [adminMessageError, setAdminMessageError] = useState("");

    // Rejection state
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectionError, setRejectionError] = useState("");

    // Reset state whenever drawer opens or target request changes
    useEffect(() => {
        setIsGlobalEditing(false);
        setEditingMonths({});
        setEditedProjections({});
        setInputErrors({});
        setAdminMessage("");
        setAdminMessageError("");
        setIsRejecting(false);
        setRejectionReason("");
        setRejectionError("");
        setCopiedId(false);
    }, [row?.request_id, open]);

    // Compute modified months
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

    // Compute totals
    const totals = useMemo(() => {
        if (!row) return { current: 0, requested: 0, approved: 0 };
        let current = 0;
        let requested = 0;
        let approved = 0;
        for (const change of row.changes) {
            current += change.current_projection ?? 0;
            requested += change.requested_projection ?? 0;
            const edited = editedProjections[change.projection_month];
            if (edited !== undefined && edited.trim() !== "" && !Number.isNaN(Number(edited))) {
                approved += Number(edited);
            } else if (change.approved_projection !== null && change.approved_projection !== undefined) {
                approved += change.approved_projection;
            } else {
                approved += change.requested_projection ?? 0;
            }
        }
        return { current, requested, approved };
    }, [row, editedProjections]);

    const handleCopyId = (id: string) => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
            toast.info("Request ID copied to clipboard");
        }
    };

    const handleProjectionInputChange = (month: string, val: string) => {
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
    };

    const handleResetMonth = (month: string, originalRequested: number) => {
        const resetVal = String(originalRequested);
        setEditedProjections((prev) => ({
            ...prev,
            [month]: resetVal,
        }));
        setInputErrors((prev) => {
            const next = { ...prev };
            delete next[month];
            return next;
        });
        setEditingMonths((prev) => ({
            ...prev,
            [month]: false,
        }));
    };

    const handleToggleGlobalEdit = () => {
        if (!row) return;

        if (isGlobalEditing) {
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
            setIsGlobalEditing(false);
            setEditingMonths({});
            return;
        }

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
        setIsGlobalEditing(true);
        if (isRejecting) {
            setIsRejecting(false);
            setRejectionError("");
        }
    };

    const handleApproveSubmit = () => {
        if (!row) return;

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
                }
            );
            return;
        }

        updateStatus(
            updateProjectionRequestStatusApi({
                request_id: row.request_id,
                status: 1,
            }),
            () => {
                toast.success("Request approved successfully");
                onStatusUpdated();
                onClose();
            }
        );
    };

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
            }
        );
    };

    if (!row) {
        return (
            <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
                <SheetContent side="right" className="w-full sm:w-[720px] max-w-full p-0" />
            </Sheet>
        );
    }

    const isPending = row.status?.toLowerCase() === "pending";

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:w-[720px] max-w-full p-0 flex flex-col h-full bg-white shadow-2xl"
            >
                {/* 1. Sticky Drawer Header */}
                <SheetHeader className="px-6 py-5 border-b bg-white shrink-0">
                    <div className="flex items-start justify-between gap-4 pr-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                                <span>{row.account_name}</span>
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                <span>{row.audience_name}</span>
                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-700 font-bold">{row.channel_name}</span>
                            </div>
                            <SheetTitle className="text-xl font-bold text-gray-900 tracking-tight">
                                Monthly Projection Review
                            </SheetTitle>
                            <SheetDescription className="text-xs text-gray-500">
                                Review requested monthly changes, adjust values, and approve or reject.
                            </SheetDescription>
                        </div>
                        <Badge
                            variant="outline"
                            className="font-semibold text-xs px-2.5 py-1 shrink-0"
                            style={getStatusBadgeStyle(row.status)}
                        >
                            {formatStatusLabel(row.status)}
                        </Badge>
                    </div>
                </SheetHeader>

                {/* 2. Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Metadata Overview Panel */}
                    <div className="rounded-2xl border border-gray-200/90 bg-gray-50/50 p-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-white rounded-xl border border-gray-200/70 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                                    Account
                                </span>
                                <span className="font-bold text-gray-900 truncate block" title={row.account_name}>
                                    {row.account_name}
                                </span>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-gray-200/70 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                                    Audience
                                </span>
                                <span className="font-bold text-gray-900 truncate block" title={row.audience_name}>
                                    {row.audience_name}
                                </span>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-gray-200/70 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                                    Channel Type
                                </span>
                                <span className="font-bold text-gray-900 truncate block" title={row.channel_type}>
                                    {row.channel_type}
                                </span>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-gray-200/70 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                                    Updated At
                                </span>
                                <span className="font-semibold text-gray-700 block truncate" title={formatDateTime(row.updated_at)}>
                                    {formatDateTime(row.updated_at)}
                                </span>
                            </div>
                        </div>

                        {/* Request ID bar with copy button */}
                        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-200/70 text-xs">
                            <div className="flex items-center gap-2 text-gray-500 min-w-0">
                                <span className="font-semibold text-gray-400 uppercase text-[10px]">Request ID:</span>
                                <span className="font-mono text-gray-700 truncate">{row.request_id}</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyId(row.request_id)}
                                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-900 gap-1 shrink-0"
                            >
                                {copiedId ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-600" />
                                        <span className="text-emerald-600 font-medium">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Previous review message */}
                        {row.message && (
                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-violet-200 bg-violet-50/60 text-xs text-violet-900">
                                <MessageSquare className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold block mb-0.5">Review Note</span>
                                    <p className="text-violet-800 leading-relaxed">{row.message}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Monthly Projection Changes Table */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-900">
                                    Monthly Projection Changes
                                </h4>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs font-semibold">
                                    {row.changes.length} {row.changes.length === 1 ? "month" : "months"}
                                </Badge>
                                {isPending && hasEdits && (
                                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                                        {modifiedMonths.length} modified
                                    </Badge>
                                )}
                            </div>

                            {isPending && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={updating || (isGlobalEditing && hasAnyInvalidInput)}
                                        onClick={handleToggleGlobalEdit}
                                        className={`h-7 px-2.5 text-xs font-medium ${
                                            isGlobalEditing
                                                ? "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
                                                : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        {isGlobalEditing ? "Done Editing" : "Edit All"}
                                    </Button>
                                    {hasEdits && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditedProjections({});
                                                setIsGlobalEditing(false);
                                                setEditingMonths({});
                                                setInputErrors({});
                                                setAdminMessage("");
                                            }}
                                            className="h-7 px-2 text-xs text-gray-500 hover:text-gray-800"
                                        >
                                            Reset All
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Structured Table */}
                        {row.changes.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50/80 border-b text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Month</th>
                                                <th className="px-4 py-3 text-right">Current</th>
                                                <th className="px-4 py-3 text-right">Requested</th>
                                                <th className="px-4 py-3 text-right">Approved</th>
                                                {isPending && <th className="px-3 py-3 text-center w-16">Action</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {row.changes.map((change, idx) => {
                                                const month = change.projection_month;
                                                const isRowEditing =
                                                    Boolean(editingMonths[month]) || isGlobalEditing;
                                                const rawVal = editedProjections[month];
                                                const currentVal =
                                                    rawVal !== undefined
                                                        ? rawVal
                                                        : String(change.requested_projection);
                                                const isModified =
                                                    rawVal !== undefined &&
                                                    rawVal.trim() !== "" &&
                                                    Number(rawVal) !== change.requested_projection;
                                                const error = inputErrors[month];

                                                return (
                                                    <tr
                                                        key={`${month}-${idx}`}
                                                        className={`transition-colors ${
                                                            isModified
                                                                ? "bg-blue-50/30 hover:bg-blue-50/50"
                                                                : "hover:bg-gray-50/70"
                                                        }`}
                                                    >
                                                        {/* Month */}
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                                <span className="font-bold text-gray-900">
                                                                    {month}
                                                                </span>
                                                                {isModified && (
                                                                    <Badge className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0 ml-1">
                                                                        Edited
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Current */}
                                                        <td className="px-4 py-3 text-right font-medium text-gray-500">
                                                            {formatMoney(change.current_projection)}
                                                        </td>

                                                        {/* Requested */}
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                            {formatMoney(change.requested_projection)}
                                                        </td>

                                                        {/* Approved */}
                                                        <td className="px-4 py-3 text-right">
                                                            {isPending && isRowEditing ? (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="25000"
                                                                        value={currentVal}
                                                                        onChange={(e) =>
                                                                            handleProjectionInputChange(
                                                                                month,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className={`h-7 w-28 text-right text-xs font-semibold bg-white ${
                                                                            error
                                                                                ? "border-red-500 focus-visible:ring-red-400"
                                                                                : "border-gray-300"
                                                                        }`}
                                                                        autoFocus={!isGlobalEditing}
                                                                    />
                                                                    {error && (
                                                                        <span className="text-[10px] text-red-600 font-medium">
                                                                            {error}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <span
                                                                        className={`font-bold block ${
                                                                            isModified
                                                                                ? "text-blue-700"
                                                                                : "text-gray-900"
                                                                        }`}
                                                                    >
                                                                        {isPending
                                                                            ? formatMoney(Number(currentVal))
                                                                            : change.approved_projection !==
                                                                                  null &&
                                                                              change.approved_projection !==
                                                                                  undefined
                                                                            ? formatMoney(
                                                                                  change.approved_projection
                                                                              )
                                                                            : row.status?.toLowerCase() ===
                                                                              "approved"
                                                                            ? formatMoney(
                                                                                  change.requested_projection
                                                                              )
                                                                            : "—"}
                                                                    </span>
                                                                    {isPending && isModified && (
                                                                        <span className="text-[10px] text-gray-400 line-through block">
                                                                            req: {formatMoney(change.requested_projection)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Action Buttons */}
                                                        {isPending && (
                                                            <td className="px-3 py-3 text-center">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    {isRowEditing ? (
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            disabled={Boolean(error)}
                                                                            onClick={() => {
                                                                                setEditingMonths((prev) => ({
                                                                                    ...prev,
                                                                                    [month]: false,
                                                                                }));
                                                                            }}
                                                                            className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                            title="Save value"
                                                                        >
                                                                            <Check className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                if (
                                                                                    editedProjections[
                                                                                        month
                                                                                    ] === undefined
                                                                                ) {
                                                                                    setEditedProjections(
                                                                                        (prev) => ({
                                                                                            ...prev,
                                                                                            [month]: String(
                                                                                                change.requested_projection
                                                                                            ),
                                                                                        })
                                                                                    );
                                                                                }
                                                                                setEditingMonths((prev) => ({
                                                                                    ...prev,
                                                                                    [month]: true,
                                                                                }));
                                                                            }}
                                                                            className="h-6 w-6 text-gray-400 hover:text-violet-700 hover:bg-violet-50"
                                                                            title="Edit projection"
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </Button>
                                                                    )}

                                                                    {isModified && (
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={() =>
                                                                                handleResetMonth(
                                                                                    month,
                                                                                    change.requested_projection
                                                                                )
                                                                            }
                                                                            className="h-6 w-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                                                            title="Revert to requested"
                                                                        >
                                                                            <RotateCcw className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        {/* Total Summary Footer Row */}
                                        <tfoot className="bg-gray-50 border-t font-semibold text-gray-700">
                                            <tr>
                                                <td className="px-4 py-2.5 text-left font-bold text-gray-900">
                                                    Total Projections
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-medium text-gray-500">
                                                    {formatMoney(totals.current)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                                                    {formatMoney(totals.requested)}
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-bold text-violet-800">
                                                    {formatMoney(totals.approved)}
                                                </td>
                                                {isPending && <td />}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-xs text-gray-500">
                                No projection changes associated with this request.
                            </div>
                        )}
                    </div>

                    {/* Admin Message Section (shown when modifications exist or global editing is active) */}
                    {isPending && (hasEdits || isGlobalEditing) && !isRejecting && (
                        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="drawer-admin-message"
                                    className="text-xs font-bold text-gray-900 flex items-center gap-1"
                                >
                                    Admin Message <span className="text-red-500">*</span>
                                </label>
                                <span className="text-[11px] text-violet-700 font-semibold">
                                    Sent to distributor upon approval
                                </span>
                            </div>
                            <Textarea
                                id="drawer-admin-message"
                                rows={2}
                                placeholder="Explain why the projection numbers were adjusted..."
                                value={adminMessage}
                                onChange={(e) => {
                                    setAdminMessage(e.target.value);
                                    if (adminMessageError) setAdminMessageError("");
                                }}
                                className={`text-xs bg-white ${
                                    adminMessageError
                                        ? "border-red-500 focus-visible:ring-red-400"
                                        : "border-gray-200"
                                }`}
                            />
                            {adminMessageError && (
                                <p className="text-[11px] font-medium text-red-600">
                                    {adminMessageError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Reject Dialog Box (when reject is clicked) */}
                    {isPending && isRejecting && (
                        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                <span>Rejection Reason (Required)</span>
                            </div>
                            <Textarea
                                rows={3}
                                placeholder="Enter the exact reason this projection request is rejected..."
                                value={rejectionReason}
                                onChange={(e) => {
                                    setRejectionReason(e.target.value);
                                    if (rejectionError) setRejectionError("");
                                }}
                                className={`text-xs bg-white ${
                                    rejectionError
                                        ? "border-red-500 focus-visible:ring-red-400"
                                        : "border-red-200"
                                }`}
                                autoFocus
                            />
                            {rejectionError && (
                                <p className="text-[11px] font-medium text-red-600">
                                    {rejectionError}
                                </p>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsRejecting(false);
                                        setRejectionError("");
                                    }}
                                    disabled={updating}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={updating}
                                    onClick={handleRejectSubmit}
                                    className="h-8 text-xs font-medium"
                                >
                                    {updating && <LoadingSpinner size="sm" className="mr-1.5" />}
                                    Confirm Rejection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Sticky Drawer Footer */}
                <div className="shrink-0 border-t px-6 py-4 flex items-center justify-between gap-3 bg-gray-50/90 backdrop-blur-xs">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={updating}
                        className="h-9 text-xs font-medium text-gray-700"
                    >
                        Close
                    </Button>

                    {isPending && !isRejecting && (
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={updating}
                                onClick={() => {
                                    setIsRejecting(true);
                                    setRejectionError("");
                                }}
                                className="h-9 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            >
                                Reject
                            </Button>

                            <Button
                                size="sm"
                                disabled={updating || hasAnyInvalidInput}
                                onClick={handleApproveSubmit}
                                className={`h-9 px-4 text-xs font-medium text-white shadow-xs ${
                                    hasEdits
                                        ? "bg-violet-700 hover:bg-violet-800"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                            >
                                {updating && <LoadingSpinner size="sm" className="mr-1.5" />}
                                {hasEdits
                                    ? `Approve with Edits (${modifiedMonths.length})`
                                    : "Approve Request"}
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export interface MonthlyProjectionRequestsSectionProps {
    targetRequestId?: string | null;
    autoOpen?: boolean;
}

interface FilteredChannel {
    channel_name: string;
    channel_type: string;
    requests: FlatRequest[];
}

interface FilteredAudience {
    audience_name: string;
    channels: FilteredChannel[];
}

interface FilteredAccount {
    account_name: string;
    audiences: FilteredAudience[];
    totalRequestsCount: number;
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

    // Sub-tab: "pending" | "browse"
    const [activeSubTab, setActiveSubTab] = useState<"pending" | "browse">("pending");

    // Pending Reviews tab states
    const [pendingSearch, setPendingSearch] = useState("");
    const [pendingAccountFilter, setPendingAccountFilter] = useState<string>("all");
    const [pendingPage, setPendingPage] = useState(1);
    const pendingPageSize = 10;

    // Browse by Account tab states
    const [browseSearch, setBrowseSearch] = useState("");
    const [browseStatusFilter, setBrowseStatusFilter] = useState<RequestStatus | "all">("all");
    const [browsePage, setBrowsePage] = useState(1);
    const browsePageSize = 10;
    const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
    const [expandedAudiences, setExpandedAudiences] = useState<Set<string>>(new Set());
    const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

    // Drawer state
    const [selectedRow, setSelectedRow] = useState<FlatRequest | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const autoOpenedIdRef = useRef<string | null>(null);
    const notFoundToastShownRef = useRef<string | null>(null);

    // API hook for fetching all projection requests
    const [getRequests, { data, loading, apiLoading, error, onClearCaches }] = useApi({
        cache: "monthly-projection-requests",
    });

    const getRequestsRef = useRef(getRequests);
    getRequestsRef.current = getRequests;

    const fetchData = useCallback(() => {
        onClearCaches?.(["monthly-projection-requests"]);
        getRequestsRef.current(fetchMonthlyProjectionRequestsApi());
    }, [onClearCaches]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        fetchData();
    }, [fetchData, mounted]);

    // Parse accounts structure
    const accounts: ApiAccount[] = useMemo(() => {
        const raw = data?.accounts ?? data?.data?.accounts;
        if (Array.isArray(raw)) return raw;

        const legacyAudiences = data?.audiences ?? data?.data?.audiences;
        if (Array.isArray(legacyAudiences)) {
            return [
                {
                    account_name: "Distributor Account",
                    audiences: legacyAudiences,
                },
            ];
        }
        return [];
    }, [data]);

    // Flatten all requests for quick indexing
    const flatRequests: FlatRequest[] = useMemo(() => {
        const list: FlatRequest[] = [];
        for (const acc of accounts) {
            for (const aud of acc.audiences || []) {
                for (const ch of aud.channels || []) {
                    for (const req of ch.requests || []) {
                        list.push({
                            account_name: acc.account_name,
                            audience_name: aud.audience_name,
                            channel_name: ch.channel_name || ch.channel_type || "Channel",
                            channel_type: ch.channel_type || "Package Insert",
                            request_id: req.request_id,
                            status: req.status,
                            updated_at: req.updated_at,
                            message: req.message,
                            changes: req.changes || [],
                        });
                    }
                }
            }
        }
        return list;
    }, [accounts]);

    // Top Stats computation
    const totalRequestsCount = flatRequests.length;
    const pendingRequestsCount = useMemo(() => {
        return flatRequests.filter((r) => r.status?.toLowerCase() === "pending").length;
    }, [flatRequests]);
    const reviewedRequestsCount = totalRequestsCount - pendingRequestsCount;

    // Distinct accounts for filter dropdown
    const distinctAccounts = useMemo(() => {
        return Array.from(new Set(flatRequests.map((r) => r.account_name))).filter(Boolean);
    }, [flatRequests]);

    // Pending Reviews filtering & pagination
    const filteredPendingRequests = useMemo(() => {
        const q = pendingSearch.toLowerCase().trim();
        return flatRequests
            .filter((r) => {
                if (r.status?.toLowerCase() !== "pending") return false;
                if (pendingAccountFilter !== "all" && r.account_name !== pendingAccountFilter) {
                    return false;
                }
                if (!q) return true;
                return (
                    r.account_name?.toLowerCase().includes(q) ||
                    r.audience_name?.toLowerCase().includes(q) ||
                    r.channel_name?.toLowerCase().includes(q) ||
                    r.channel_type?.toLowerCase().includes(q) ||
                    r.request_id?.toLowerCase().includes(q)
                );
            })
            .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
    }, [flatRequests, pendingSearch, pendingAccountFilter]);

    const pendingTotalPages = Math.max(
        1,
        Math.ceil(filteredPendingRequests.length / pendingPageSize)
    );
    const paginatedPendingRequests = useMemo(() => {
        const start = (pendingPage - 1) * pendingPageSize;
        return filteredPendingRequests.slice(start, start + pendingPageSize);
    }, [filteredPendingRequests, pendingPage, pendingPageSize]);

    // Browse by Account hierarchy filtering & pagination
    const filteredAccountGroups = useMemo(() => {
        const q = browseSearch.toLowerCase().trim();
        const s = browseStatusFilter;

        const result: FilteredAccount[] = [];

        for (const acc of accounts) {
            const filteredAudiences: FilteredAudience[] = [];

            for (const aud of acc.audiences || []) {
                const filteredChannels: FilteredChannel[] = [];

                for (const ch of aud.channels || []) {
                    const chName = ch.channel_name || ch.channel_type || "Channel";
                    const chType = ch.channel_type || "Package Insert";

                    const chFlatRequests: FlatRequest[] = (ch.requests || []).map((req) => ({
                        account_name: acc.account_name,
                        audience_name: aud.audience_name,
                        channel_name: chName,
                        channel_type: chType,
                        request_id: req.request_id,
                        status: req.status,
                        updated_at: req.updated_at,
                        message: req.message,
                        changes: req.changes || [],
                    }));

                    const matchingRequests = chFlatRequests.filter((r) => {
                        if (s !== "all" && r.status?.toLowerCase() !== s.toLowerCase()) {
                            return false;
                        }
                        return true;
                    });

                    const matchesSearch =
                        !q ||
                        acc.account_name?.toLowerCase().includes(q) ||
                        aud.audience_name?.toLowerCase().includes(q) ||
                        chName.toLowerCase().includes(q) ||
                        chType.toLowerCase().includes(q) ||
                        matchingRequests.some((r) => r.request_id.toLowerCase().includes(q));

                    if (matchesSearch && (s === "all" || matchingRequests.length > 0)) {
                        filteredChannels.push({
                            channel_name: chName,
                            channel_type: chType,
                            requests: matchingRequests,
                        });
                    }
                }

                if (filteredChannels.length > 0) {
                    filteredAudiences.push({
                        audience_name: aud.audience_name,
                        channels: filteredChannels,
                    });
                }
            }

            if (filteredAudiences.length > 0) {
                const totalCount = filteredAudiences.reduce(
                    (sum, a) => sum + a.channels.reduce((cs, c) => cs + c.requests.length, 0),
                    0
                );
                result.push({
                    account_name: acc.account_name,
                    audiences: filteredAudiences,
                    totalRequestsCount: totalCount,
                });
            }
        }

        return result;
    }, [accounts, browseSearch, browseStatusFilter]);

    const browseTotalPages = Math.max(
        1,
        Math.ceil(filteredAccountGroups.length / browsePageSize)
    );
    const paginatedAccountGroups = useMemo(() => {
        const start = (browsePage - 1) * browsePageSize;
        return filteredAccountGroups.slice(start, start + browsePageSize);
    }, [filteredAccountGroups, browsePage, browsePageSize]);

    // Expand / Collapse all logic
    const isAllExpanded = useMemo(() => {
        if (filteredAccountGroups.length === 0) return false;
        return filteredAccountGroups.every((g) => expandedAccounts.has(g.account_name));
    }, [filteredAccountGroups, expandedAccounts]);

    const toggleAllGroups = () => {
        if (isAllExpanded) {
            setExpandedAccounts(new Set());
            setExpandedAudiences(new Set());
            setExpandedChannels(new Set());
        } else {
            const nextAccounts = new Set<string>();
            const nextAudiences = new Set<string>();
            const nextChannels = new Set<string>();

            for (const g of filteredAccountGroups) {
                nextAccounts.add(g.account_name);
                for (const a of g.audiences) {
                    const ak = `${g.account_name}|${a.audience_name}`;
                    nextAudiences.add(ak);
                    for (const c of a.channels) {
                        const ck = `${ak}|${c.channel_name}`;
                        nextChannels.add(ck);
                    }
                }
            }
            setExpandedAccounts(nextAccounts);
            setExpandedAudiences(nextAudiences);
            setExpandedChannels(nextChannels);
        }
    };

    const toggleAccount = (accountName: string) => {
        setExpandedAccounts((prev) => {
            const next = new Set(prev);
            if (next.has(accountName)) next.delete(accountName);
            else next.add(accountName);
            return next;
        });
    };

    const toggleAudience = (audienceKey: string) => {
        setExpandedAudiences((prev) => {
            const next = new Set(prev);
            if (next.has(audienceKey)) next.delete(audienceKey);
            else next.add(audienceKey);
            return next;
        });
    };

    const toggleChannel = (channelKey: string) => {
        setExpandedChannels((prev) => {
            const next = new Set(prev);
            if (next.has(channelKey)) next.delete(channelKey);
            else next.add(channelKey);
            return next;
        });
    };

    // Deep-linking URL handler
    useEffect(() => {
        if (!targetRequestId) {
            autoOpenedIdRef.current = null;
        }
    }, [targetRequestId]);

    useEffect(() => {
        if (!targetRequestId || !autoOpen || loading) return;
        if (autoOpenedIdRef.current === targetRequestId) return;

        const match = flatRequests.find((r) => r.request_id === targetRequestId);
        if (match) {
            autoOpenedIdRef.current = targetRequestId;
            setSelectedRow(match);
            setDrawerOpen(true);
        }
    }, [flatRequests, loading, targetRequestId, autoOpen]);

    useEffect(() => {
        if (!targetRequestId || loading || !data) return;
        if (autoOpenedIdRef.current === targetRequestId) return;
        if (notFoundToastShownRef.current === targetRequestId) return;

        const match = flatRequests.find((r) => r.request_id === targetRequestId);
        if (!match && flatRequests.length > 0) {
            notFoundToastShownRef.current = targetRequestId;
            toast.info(`Projection request "${targetRequestId}" not found.`);
        }
    }, [flatRequests, loading, data, targetRequestId]);

    const handleOpenDrawer = (request: FlatRequest) => {
        setSelectedRow(request);
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

    const handleResetAll = () => {
        setPendingSearch("");
        setPendingAccountFilter("all");
        setPendingPage(1);
        setBrowseSearch("");
        setBrowseStatusFilter("all");
        setBrowsePage(1);
        handleStatusUpdated();
    };

    if (!mounted) return null;

    return (
        <section className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Monthly Projection Requests
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Review pending distributor changes or explore request history by account.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStatusUpdated}
                    disabled={apiLoading}
                    className="text-gray-700 hover:text-gray-900 h-9 shrink-0"
                    aria-label="Refresh projection requests"
                >
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${apiLoading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Top 3 KPI Stat Cards with Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Total Requests
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <Layers className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 mt-2">
                        {loading ? "…" : totalRequestsCount}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Across all distributor accounts</p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs transition-shadow hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                            Pending Reviews
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-amber-800 mt-2">
                        {loading ? "…" : pendingRequestsCount}
                    </div>
                    <p className="text-xs text-amber-600/80 mt-1">Awaiting admin review</p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-xs transition-shadow hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                            Reviewed
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-800 mt-2">
                        {loading ? "…" : reviewedRequestsCount}
                    </div>
                    <p className="text-xs text-emerald-600/80 mt-1">Approved or rejected</p>
                </div>
            </div>

            {/* Sub-Tabs Pills Navigation */}
            <div className="flex border-b border-gray-200 gap-1">
                <button
                    type="button"
                    onClick={() => setActiveSubTab("pending")}
                    className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
                        activeSubTab === "pending"
                            ? "border-violet-600 text-violet-700 font-bold"
                            : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                >
                    <Clock className="h-4 w-4" />
                    <span>Pending Reviews</span>
                    <Badge
                        variant="secondary"
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            activeSubTab === "pending"
                                ? "bg-violet-100 text-violet-800 font-bold"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {pendingRequestsCount}
                    </Badge>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSubTab("browse")}
                    className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
                        activeSubTab === "browse"
                            ? "border-violet-600 text-violet-700 font-bold"
                            : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                >
                    <Building2 className="h-4 w-4" />
                    <span>Browse by Account</span>
                    <Badge
                        variant="secondary"
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            activeSubTab === "browse"
                                ? "bg-violet-100 text-violet-800 font-bold"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        {accounts.length}
                    </Badge>
                </button>
            </div>

            {/* Tab 1: Pending Reviews */}
            {activeSubTab === "pending" && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative min-w-[260px]">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search account, audience, channel..."
                                    value={pendingSearch}
                                    onChange={(e) => {
                                        setPendingSearch(e.target.value);
                                        setPendingPage(1);
                                    }}
                                    className="pl-9 pr-8 h-9 text-xs bg-white"
                                />
                                {pendingSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPendingSearch("");
                                            setPendingPage(1);
                                        }}
                                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Select
                                value={pendingAccountFilter}
                                onValueChange={(val) => {
                                    setPendingAccountFilter(val);
                                    setPendingPage(1);
                                }}
                            >
                                <SelectTrigger className="w-56 h-9 text-xs bg-white">
                                    <SelectValue placeholder="All Accounts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Accounts</SelectItem>
                                    {distinctAccounts.map((acc) => (
                                        <SelectItem key={acc} value={acc}>
                                            {acc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(pendingSearch || pendingAccountFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setPendingSearch("");
                                        setPendingAccountFilter("all");
                                        setPendingPage(1);
                                    }}
                                    className="h-9 px-2 text-xs text-gray-500 hover:text-gray-900"
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            Newest requests first
                        </span>
                    </div>

                    {/* Table Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b">
                                    <tr>
                                        <th className="px-4 py-3.5">Account / Audience</th>
                                        <th className="px-4 py-3.5">Channel</th>
                                        <th className="px-4 py-3.5">Changes</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5">Updated At</th>
                                        <th className="px-4 py-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && (
                                        <tr>
                                            <td colSpan={6} className="py-14 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                                                    <LoadingSpinner size="lg" />
                                                    Loading pending requests…
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && error && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-red-600 text-sm">
                                                Failed to load projection requests.
                                            </td>
                                        </tr>
                                    )}

                                    {!loading &&
                                        !error &&
                                        filteredPendingRequests.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="py-14 text-center text-sm text-gray-500"
                                                >
                                                    No pending requests match these filters.
                                                </td>
                                            </tr>
                                        )}

                                    {!loading &&
                                        !error &&
                                        paginatedPendingRequests.map((req) => (
                                            <tr
                                                key={req.request_id}
                                                className="group transition-colors hover:bg-violet-50/40 cursor-pointer"
                                                onClick={() => handleOpenDrawer(req)}
                                            >
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                                                        {req.account_name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                                        {req.audience_name}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-semibold text-gray-900">
                                                        {req.channel_name}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                                        {req.channel_type}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-700 font-semibold">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px]">
                                                        {req.changes.length} {req.changes.length === 1 ? "month" : "months"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="font-semibold text-xs px-2.5 py-0.5"
                                                        style={getStatusBadgeStyle(req.status)}
                                                    >
                                                        {formatStatusLabel(req.status)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-500 text-[11px]">
                                                    {formatDateTime(req.updated_at)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenDrawer(req)}
                                                        className="bg-violet-700 hover:bg-violet-800 text-white font-medium h-8 text-xs shadow-xs"
                                                    >
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 text-xs text-gray-500 border-t border-gray-100 gap-2 bg-white">
                            <p className="text-xs text-gray-600">
                                Showing{" "}
                                {filteredPendingRequests.length
                                    ? (pendingPage - 1) * pendingPageSize + 1
                                    : 0}
                                –
                                {Math.min(
                                    filteredPendingRequests.length,
                                    pendingPage * pendingPageSize
                                )}{" "}
                                of {filteredPendingRequests.length} requests
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pendingPage <= 1}
                                    onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                                    className="h-8 text-xs px-2.5"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                    Previous
                                </Button>
                                <span className="font-medium text-gray-700 px-1">
                                    Page {pendingPage} of {pendingTotalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pendingPage >= pendingTotalPages}
                                    onClick={() =>
                                        setPendingPage((p) => Math.min(pendingTotalPages, p + 1))
                                    }
                                    className="h-8 text-xs px-2.5"
                                >
                                    Next
                                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Browse by Account */}
            {activeSubTab === "browse" && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative min-w-[280px]">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search accounts, audiences, channels, IDs..."
                                    value={browseSearch}
                                    onChange={(e) => {
                                        setBrowseSearch(e.target.value);
                                        setBrowsePage(1);
                                    }}
                                    className="pl-9 pr-8 h-9 text-xs bg-white"
                                />
                                {browseSearch && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBrowseSearch("");
                                            setBrowsePage(1);
                                        }}
                                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Select
                                value={browseStatusFilter}
                                onValueChange={(val) => {
                                    setBrowseStatusFilter(val as RequestStatus | "all");
                                    setBrowsePage(1);
                                }}
                            >
                                <SelectTrigger className="w-52 h-9 text-xs bg-white">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="approved_with_edits">Approved with Edits</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            {(browseSearch || browseStatusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setBrowseSearch("");
                                        setBrowseStatusFilter("all");
                                        setBrowsePage(1);
                                    }}
                                    className="h-9 px-2 text-xs text-gray-500 hover:text-gray-900"
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reset Filters
                                </Button>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAllGroups}
                            className="text-xs h-9 text-gray-700 hover:text-gray-900 shrink-0"
                        >
                            {isAllExpanded ? "Collapse All" : "Expand All"}
                        </Button>
                    </div>

                    {/* Hierarchy Tree Cards */}
                    <div className="space-y-3">
                        {loading && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-14 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                                    <LoadingSpinner size="lg" />
                                    Loading distributor accounts…
                                </div>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
                                Failed to load projection requests.
                            </div>
                        )}

                        {!loading &&
                            !error &&
                            filteredAccountGroups.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-14 text-center text-sm text-gray-500">
                                    No accounts match these filters.
                                </div>
                            )}

                        {!loading &&
                            !error &&
                            paginatedAccountGroups.map((accountGroup) => {
                                const accName = accountGroup.account_name;
                                const isAccountExpanded = expandedAccounts.has(accName);

                                return (
                                    <div
                                        key={accName}
                                        className="rounded-2xl border border-gray-200/90 bg-white overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
                                    >
                                        {/* Account Level Header Button */}
                                        <button
                                            type="button"
                                            onClick={() => toggleAccount(accName)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-violet-50/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-bold">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm">
                                                    {accName}
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    · {accountGroup.audiences.length} audience(s) · {accountGroup.totalRequestsCount} request(s)
                                                </span>
                                            </div>
                                            <span className="text-gray-400">
                                                {isAccountExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </span>
                                        </button>

                                        {/* Account Body: Audiences */}
                                        {isAccountExpanded && (
                                            <div className="p-4 space-y-3.5 bg-white border-t border-gray-100">
                                                {accountGroup.audiences.map((audience) => {
                                                    const audKey = `${accName}|${audience.audience_name}`;
                                                    const isAudienceExpanded =
                                                        expandedAudiences.has(audKey);

                                                    return (
                                                        <div
                                                            key={audKey}
                                                            className="border-l-2 border-violet-300 pl-4 py-1"
                                                        >
                                                            {/* Audience Header Button */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleAudience(audKey)
                                                                }
                                                                className="flex items-center gap-2 py-1 text-left group"
                                                            >
                                                                <span className="text-xs text-violet-600 transition-transform">
                                                                    {isAudienceExpanded ? (
                                                                        <ChevronDown className="h-3.5 w-3.5" />
                                                                    ) : (
                                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                                    )}
                                                                </span>
                                                                <span className="font-bold text-xs text-gray-800 group-hover:text-violet-800">
                                                                    {audience.audience_name}
                                                                </span>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-violet-50 text-violet-700 text-[10px] font-semibold px-2 py-0"
                                                                >
                                                                    {audience.channels.length} channel(s)
                                                                </Badge>
                                                            </button>

                                                            {/* Channels inside Audience */}
                                                            {isAudienceExpanded && (
                                                                <div className="mt-2.5 space-y-2.5">
                                                                    {audience.channels.map(
                                                                        (channel) => {
                                                                            const chanKey = `${audKey}|${channel.channel_name}`;
                                                                            const isChannelExpanded =
                                                                                expandedChannels.has(
                                                                                    chanKey
                                                                                );

                                                                            return (
                                                                                <div
                                                                                    key={chanKey}
                                                                                    className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                                                                                >
                                                                                    {/* Channel Head */}
                                                                                    <div className="flex items-center justify-between p-3 bg-gray-50/50">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="font-bold text-xs text-gray-900">
                                                                                                {channel.channel_name}
                                                                                            </span>
                                                                                            <Badge variant="outline" className="text-[10px] text-gray-500 font-normal">
                                                                                                {channel.channel_type}
                                                                                            </Badge>
                                                                                        </div>

                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-xs text-gray-500 font-medium">
                                                                                                {channel.requests.length} request(s)
                                                                                            </span>
                                                                                            <Button
                                                                                                variant="outline"
                                                                                                size="sm"
                                                                                                onClick={() =>
                                                                                                    toggleChannel(
                                                                                                        chanKey
                                                                                                    )
                                                                                                }
                                                                                                className="h-7 text-xs font-medium"
                                                                                            >
                                                                                                {isChannelExpanded
                                                                                                    ? "Hide Requests"
                                                                                                    : "View Requests"}
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Channel Requests */}
                                                                                    {isChannelExpanded && (
                                                                                        <div className="p-3 bg-gray-50/20 border-t border-gray-100 space-y-2">
                                                                                            {channel.requests
                                                                                                .length >
                                                                                            0 ? (
                                                                                                channel.requests.map(
                                                                                                    (
                                                                                                        r
                                                                                                    ) => (
                                                                                                        <div
                                                                                                            key={
                                                                                                                r.request_id
                                                                                                            }
                                                                                                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 gap-3"
                                                                                                        >
                                                                                                            <div>
                                                                                                                <div className="font-semibold text-xs text-gray-900 font-mono">
                                                                                                                    Request {r.request_id.slice(
                                                                                                                        0,
                                                                                                                        8
                                                                                                                    )}
                                                                                                                    …
                                                                                                                </div>
                                                                                                                <div className="text-[11px] text-gray-500 mt-0.5">
                                                                                                                    {formatDateTime(
                                                                                                                        r.updated_at
                                                                                                                    )}{" "}
                                                                                                                    ·{" "}
                                                                                                                    {
                                                                                                                        r.changes
                                                                                                                            .length
                                                                                                                    }{" "}
                                                                                                                    change(s)
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <div className="flex items-center gap-2">
                                                                                                                <Badge
                                                                                                                    variant="outline"
                                                                                                                    className="text-[11px] font-semibold px-2 py-0.5"
                                                                                                                    style={getStatusBadgeStyle(
                                                                                                                        r.status
                                                                                                                    )}
                                                                                                                >
                                                                                                                    {formatStatusLabel(
                                                                                                                        r.status
                                                                                                                    )}
                                                                                                                </Badge>
                                                                                                                <Button
                                                                                                                    size="sm"
                                                                                                                    variant={
                                                                                                                        r.status?.toLowerCase() ===
                                                                                                                        "pending"
                                                                                                                            ? "default"
                                                                                                                            : "outline"
                                                                                                                    }
                                                                                                                    onClick={() =>
                                                                                                                        handleOpenDrawer(
                                                                                                                            r
                                                                                                                        )
                                                                                                                    }
                                                                                                                    className={`h-7 text-xs font-medium ${
                                                                                                                        r.status?.toLowerCase() ===
                                                                                                                        "pending"
                                                                                                                            ? "bg-violet-700 hover:bg-violet-800 text-white"
                                                                                                                            : ""
                                                                                                                    }`}
                                                                                                                >
                                                                                                                    {r.status?.toLowerCase() ===
                                                                                                                    "pending"
                                                                                                                        ? "Review"
                                                                                                                        : "View Details"}
                                                                                                                </Button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                )
                                                                                            ) : (
                                                                                                <div className="py-2 text-center text-xs text-gray-500">
                                                                                                    No matching requests.
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        }
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>

                    {/* Pagination Footer for Browse by Account */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 text-xs text-gray-500 border rounded-2xl bg-white gap-2">
                        <p className="text-xs text-gray-600">
                            Showing{" "}
                            {filteredAccountGroups.length
                                ? (browsePage - 1) * browsePageSize + 1
                                : 0}
                            –
                            {Math.min(
                                filteredAccountGroups.length,
                                browsePage * browsePageSize
                            )}{" "}
                            of {filteredAccountGroups.length} accounts
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={browsePage <= 1}
                                onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                                className="h-8 text-xs px-2.5"
                            >
                                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                Previous
                            </Button>
                            <span className="font-medium text-gray-700 px-1">
                                Page {browsePage} of {browseTotalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={browsePage >= browseTotalPages}
                                onClick={() =>
                                    setBrowsePage((p) => Math.min(browseTotalPages, p + 1))
                                }
                                className="h-8 text-xs px-2.5"
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Drawer */}
            <ProjectionRequestDrawer
                row={selectedRow}
                open={drawerOpen}
                onClose={handleCloseDrawer}
                onStatusUpdated={handleStatusUpdated}
            />
        </section>
    );
}
