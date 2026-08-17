"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import {
    downloadOmsDcDetailsPdfApi,
    getProjectionShipmentLogsByChannelApi,
    submitProjectionChangeRequestApi,
} from "@/api/retailer";
import { useAudienceChannel } from "@/hooks/useAudienceChannel";
import { retailerAudienceChannelSelectionAtomFamily } from "@/store/retailerAudienceChannel";
import { AudienceChannelSelector } from "@/components/retailer/AudienceChannelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, BarChart3, ChevronDown, ChevronRight, Clock, FileDown, Pencil, RefreshCw, X } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

type MonthName = (typeof MONTHS)[number];
type ProjectionFormValues = Record<MonthName, string>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const quantityFieldSchema = z
    .string()
    .refine(
        (value) => value === "" || Number(value) % 25000 === 0,
        "Must be a multiple of 25,000",
    );

const projectionSchema = z.object(
    MONTHS.reduce(
        (acc, month) => {
            acc[month] = quantityFieldSchema;
            return acc;
        },
        {} as Record<MonthName, typeof quantityFieldSchema>,
    ),
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistributionCenter {
    allocation_percentage: number;
    distribution_center_name: string;
    distribution_center_salesforce_id: string;
    shipment_logs_count: number;
}

interface ShipmentLogMonth {
    distribution_centers: DistributionCenter[];
    month: number;
    month_name: string;
    total_shipment_logs: number;
    year: number;
}

interface PendingRequestChange {
    current_projection: number;
    projection_month: string;
    requested_projection: number;
}

interface PendingRequest {
    changes: PendingRequestChange[];
    created_at: string;
    status: string;
}

interface ProjectionData {
    audience_id: string;
    channel_id: string;
    has_pending_request: boolean;
    pending_requests: PendingRequest[];
    projection: Record<MonthName, number>;
    shipment_logs_data: ShipmentLogMonth[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
    return new Intl.NumberFormat("en-US").format(n);
}

function normalizeProjection(
    projection: Record<string, number>,
): ProjectionFormValues {
    return MONTHS.reduce((acc, month) => {
        const val = projection?.[month];
        acc[month] = val !== undefined && val !== null ? String(val) : "";
        return acc;
    }, {} as ProjectionFormValues);
}

function hasChanges(
    current: ProjectionFormValues,
    original: ProjectionFormValues,
): boolean {
    return MONTHS.some((m) => current[m] !== original[m]);
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {message}
        </div>
    );
}

function formatDateTime(iso: string): string {
    try {
        return new Date(iso).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

// ─── Pending Requests Modal ───────────────────────────────────────────────────

interface PendingRequestsModalProps {
    open: boolean;
    onClose: () => void;
    requests: PendingRequest[];
}

function PendingRequestsModal({ open, onClose, requests }: PendingRequestsModalProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Pending Projection Requests
                    </DialogTitle>
                </DialogHeader>

                {requests.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">
                        No pending requests found.
                    </p>
                ) : (
                    <div className="space-y-4 mt-2">
                        {requests.map((req, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden"
                            >
                                {/* Request header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-50">
                                    <span className="text-xs text-gray-500">
                                        Submitted {formatDateTime(req.created_at)}
                                    </span>
                                    <Badge className="bg-amber-100 text-amber-700 capitalize">
                                        {req.status}
                                    </Badge>
                                </div>

                                {/* Changes table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-amber-100">
                                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Month
                                                </th>
                                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Current
                                                </th>
                                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Requested
                                                </th>
                                                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Difference
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {req.changes.map((change, j) => {
                                                const diff = change.requested_projection - change.current_projection;
                                                return (
                                                    <tr
                                                        key={j}
                                                        className="border-b last:border-0 hover:bg-amber-50/60 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 font-medium text-gray-900">
                                                            {change.projection_month}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-600">
                                                            {formatNumber(change.current_projection)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                            {formatNumber(change.requested_projection)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-semibold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-500"}`}>
                                                            {diff > 0 ? "+" : ""}{formatNumber(diff)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Monthly Projections Section ──────────────────────────────────────────────

interface MonthlyProjectionsSectionProps {
    projection: Record<MonthName, number>;
    channelId: string;
    hasPendingRequest: boolean;
    pendingRequests: PendingRequest[];
    onSaved: () => void;
}

function MonthlyProjectionsSection({
    projection,
    channelId,
    hasPendingRequest,
    pendingRequests,
    onSaved,
}: MonthlyProjectionsSectionProps) {
    const [editing, setEditing] = useState(false);
    const [pendingModalOpen, setPendingModalOpen] = useState(false);
    const originalRef = useRef<ProjectionFormValues>({} as ProjectionFormValues);

    const [callSubmit, { loading: saving }] = useApi({ errMsg: true });

    const {
        register,
        reset,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ProjectionFormValues>({
        resolver: zodResolver(projectionSchema) as any,
        mode: "onChange",
        defaultValues: normalizeProjection(projection),
    });

    const watchedValues = watch();
    const isDirty = editing && hasChanges(watchedValues, originalRef.current);

    // Re-sync when projection data refreshes (e.g. after save)
    useEffect(() => {
        const normalized = normalizeProjection(projection);
        originalRef.current = normalized;
        reset(normalized);
        setEditing(false);
    }, [projection, reset]);

    const handleEdit = () => {
        const normalized = normalizeProjection(projection);
        originalRef.current = normalized;
        reset(normalized);
        setEditing(true);
    };

    const handleCancel = () => {
        reset(originalRef.current);
        setEditing(false);
    };

    const onSubmit = (values: ProjectionFormValues) => {
        const monthly_projections = MONTHS.reduce(
            (acc, month) => {
                const raw = values[month].trim();
                acc[month] = raw === "" ? 0 : Number(raw);
                return acc;
            },
            {} as Record<string, number>,
        );

        callSubmit(
            submitProjectionChangeRequestApi({ channel_id: channelId, monthly_projections }),
            () => {
                setEditing(false);
                onSaved();
            },
        );
    };

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Monthly Projections
                </h2>
                {hasPendingRequest ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPendingModalOpen(true)}
                        className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                        <Clock className="h-3.5 w-3.5" />
                        View Pending Request
                    </Button>
                ) : !editing ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEdit}
                        className="gap-1.5"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Projections
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={saving}
                            className="gap-1.5"
                        >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            disabled={!isDirty || saving}
                            className="bg-blue-gradient text-white hover:bg-blue-gradient/90 gap-1.5 min-w-20"
                            onClick={handleSubmit(onSubmit)}
                        >
                            {saving ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    Saving…
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Pending notice banner */}
            {hasPendingRequest && (
                <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 border-b border-amber-200">
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-700">
                        A projection change request is pending approval. Editing is disabled until it is reviewed.
                    </p>
                </div>
            )}

            {/* Grid */}
            <div className="p-5">
                {editing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {MONTHS.map((month) => (
                            <div key={month}>
                                <Label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    {month}
                                </Label>
                                <Input
                                    {...register(month, {
                                        onChange: (e) => {
                                            e.target.value = e.target.value.replace(/\D/g, "");
                                        },
                                    })}
                                    inputMode="numeric"
                                    placeholder="25000"
                                    disabled={saving}
                                />
                                <FieldError message={errors[month]?.message} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {MONTHS.map((month) => {
                            const value = projection?.[month] ?? 0;
                            return (
                                <div
                                    key={month}
                                    className="rounded-lg border bg-gray-50 px-4 py-3 text-center"
                                >
                                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                                        {month.slice(0, 3)}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {formatNumber(value)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {editing && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm text-blue-700">
                            Enter values in increments of 25,000.
                        </p>
                    </div>
                )}
            </div>

            <PendingRequestsModal
                open={pendingModalOpen}
                onClose={() => setPendingModalOpen(false)}
                requests={pendingRequests}
            />
        </div>
    );
}

// ─── Shipment Logs Section ────────────────────────────────────────────────────

interface ShipmentLogsSectionProps {
    data: ShipmentLogMonth[];
    onDistributionCenterClick?: (dcSalesforceId: string) => void;
}

function ShipmentLogsSection({ data, onDistributionCenterClick }: ShipmentLogsSectionProps) {
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    // Expand all by default on first render / data change
    useEffect(() => {
        const keys = data.map((m) => `${m.year}-${m.month}`);
        setExpandedKeys(new Set(keys));
    }, [data]);

    const toggle = (key: string) => {
        setExpandedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const sorted = [...data].sort((a, b) =>
        b.year !== a.year ? b.year - a.year : b.month - a.month,
    );

    return (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Shipment Logs
                </h2>
            </div>

            <div className="p-5 space-y-3">
                {sorted.length === 0 && (
                    <div className="text-center py-10 text-sm text-gray-400">
                        No shipment log data available for this channel.
                    </div>
                )}

                {sorted.map((monthData) => {
                    const key = `${monthData.year}-${monthData.month}`;
                    const isExpanded = expandedKeys.has(key);

                    return (
                        <div
                            key={key}
                            className="rounded-lg border overflow-hidden"
                        >
                            {/* Month header */}
                            <button
                                onClick={() => toggle(key)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                    )}
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {monthData.month_name} {monthData.year}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-gray-700 shrink-0 ml-4">
                                    {formatNumber(monthData.total_shipment_logs)}{" "}
                                    <span className="text-xs font-normal text-gray-400">logs</span>
                                </div>
                            </button>

                            {/* Distribution Centers */}
                            {isExpanded && (
                                <div className="border-t">
                                    {monthData.distribution_centers.length === 0 ? (
                                        <div className="px-4 py-6 text-sm text-center text-gray-400">
                                            No distribution center data for this month.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b">
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                            Distribution Center
                                                        </th>
                                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                            Allocation %
                                                        </th>
                                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                            Shipment Logs
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {monthData.distribution_centers.map((dc) => (
                                                        <tr
                                                            key={dc.distribution_center_salesforce_id}
                                                            className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                                {onDistributionCenterClick && dc.distribution_center_salesforce_id ? (
                                                                    <button
                                                                        onClick={() => onDistributionCenterClick(dc.distribution_center_salesforce_id)}
                                                                        className="text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors"
                                                                    >
                                                                        {dc.distribution_center_name}
                                                                    </button>
                                                                ) : (
                                                                    dc.distribution_center_name
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-gray-600">
                                                                {dc.allocation_percentage}%
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-gray-700 font-medium">
                                                                {formatNumber(dc.shipment_logs_count)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ProjectionShipmentLogsPage() {
    const router = useRouter();
    const setDCSelection = useSetAtom(
        retailerAudienceChannelSelectionAtomFamily("distribution-centers"),
    );

    const {
        audiences,
        selectedAudienceId,
        selectedChannelId,
        selectedAudience,
        loading: loadingStats,
        error: statsError,
        setSelectedChannelId,
        handleAudienceChange,
        refresh,
    } = useAudienceChannel("projection-shipment-logs");

    const [projectionData, setProjectionData] = useState<ProjectionData | null>(null);
    const [callFetch, { loading: loadingData, error: fetchError }] = useApi({ errMsg: true });
    const [callDownloadGuide, { loading: downloadingGuide }] = useApi({ errMsg: true });

    const fetchProjectionData = (channelId: string) => {
        setProjectionData(null);
        callFetch(
            getProjectionShipmentLogsByChannelApi(channelId),
            ({ data }: any) => {
                setProjectionData(data?.data ?? data ?? null);
            },
        );
    };

    useEffect(() => {
        if (!selectedChannelId) return;
        fetchProjectionData(selectedChannelId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChannelId]);

    const handleSaved = () => {
        if (selectedChannelId) {
            fetchProjectionData(selectedChannelId);
        }
    };

    const handleDownloadGuide = () => {
        if (!selectedAudienceId) return;
        callDownloadGuide(downloadOmsDcDetailsPdfApi(selectedAudienceId));
    };

    const handleDCClick = (dcSalesforceId: string) => {
        // Sync the distribution-centers scope selection to the current audience + channel,
        // then navigate to the Distribution Centers page with the target DC highlighted.
        if (selectedAudienceId && selectedChannelId) {
            setDCSelection({ audienceId: selectedAudienceId, channelId: selectedChannelId });
        }
        router.push(`/retailer/distribution-centers?dc=${encodeURIComponent(dcSalesforceId)}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {!loadingStats && audiences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        No Audience Data Available
                    </h2>
                    <p className="text-sm text-gray-500 max-w-sm">
                        This section will become available once account setup is complete.
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Projection &amp; Shipment Logs
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                View monthly shipment projections and log history by channel.
                            </p>
                        </div>
                        <Button
                            onClick={handleDownloadGuide}
                            disabled={!selectedAudienceId || downloadingGuide}
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                        >
                            <FileDown className="h-4 w-4 mr-2" />
                            {downloadingGuide ? "Downloading..." : "Data Feed Integration Guide"}
                        </Button>
                    </div>

                    {/* Audience / Channel Selector */}
                    <div className="mb-6">
                        <AudienceChannelSelector
                            audiences={audiences}
                            selectedAudienceId={selectedAudienceId}
                            selectedChannelId={selectedChannelId}
                            selectedAudience={selectedAudience}
                            loading={loadingStats}
                            error={statsError}
                            onAudienceChange={handleAudienceChange}
                            onChannelChange={setSelectedChannelId}
                            onRefresh={refresh}
                            showChannelStatus={false}
                        />
                    </div>

                    {/* Data area */}
                    {loadingData ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : fetchError ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <p className="text-sm text-red-600">
                                Failed to load projection and shipment log data.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    selectedChannelId && fetchProjectionData(selectedChannelId)
                                }
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    ) : !selectedChannelId ? (
                        <div className="text-center py-20 text-gray-400 text-sm">
                            Select an audience and channel to view projection and shipment log data.
                        </div>
                    ) : projectionData ? (
                        <div className="space-y-6">
                            <MonthlyProjectionsSection
                                projection={projectionData.projection as Record<MonthName, number>}
                                channelId={projectionData.channel_id}
                                hasPendingRequest={projectionData.has_pending_request ?? false}
                                pendingRequests={projectionData.pending_requests ?? []}
                                onSaved={handleSaved}
                            />
                            <ShipmentLogsSection
                                data={projectionData.shipment_logs_data}
                                onDistributionCenterClick={handleDCClick}
                            />
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}
