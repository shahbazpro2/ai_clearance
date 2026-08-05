"use client";

import { useEffect, useState, useCallback } from "react";
import { useApi } from "use-hook-api";
import {
    getAuthorizedDistributionCentersApi,
    getDistributionCenterInventoryApi,
    submitSkidUpdatesApi,
} from "@/api/inventory";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Package2,
    Loader2,
    Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistributionCenter {
    salesforce_distribution_center_id: string;
    name: string;
    ship_to_name: string;
    city: string;
    state: string;
}

interface Skid {
    id: string;
    skid_id: string;
    initial_total_cartons: number;
    cartons_remaining_last_update: number;
}

interface Order {
    id: string;
    name: string;
    is_envelope_order: boolean;
    advertiser: string | null;
    category: string | null;
    skid_label_warning: boolean;
    skids: Skid[];
}

interface BookingMonth {
    booking_month: string;
    status: "not_started" | "in_progress";
    total_skids: number;
    orders: Order[];
}

// Map of skid.id → user-entered cartons_remaining value
type SkidEdits = Record<string, number>;

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPOSITE_MAX_RECORDS = 200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: BookingMonth["status"]) {
    if (status === "in_progress") {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 uppercase tracking-wide">
                In Progress
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 uppercase tracking-wide">
            Not Started
        </span>
    );
}

function skidCount(n: number) {
    return (
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {n} skid{n !== 1 ? "s" : ""}
        </span>
    );
}

// ─── Skid Table ───────────────────────────────────────────────────────────────

interface SkidTableProps {
    skids: Skid[];
    edits: SkidEdits;
    onEdit: (skidId: string, value: number | undefined) => void;
}

function SkidTable({ skids, edits, onEdit }: SkidTableProps) {
    return (
        <div className="overflow-x-auto border-t bg-white">
            <table className="w-full min-w-[620px] text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[140px]">
                            Skid ID
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Initial Total Cartons
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Cartons Remaining Last Update
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[180px]">
                            Cartons Remaining This Update
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {skids.map((skid) => {
                        const editValue = edits[skid.id];
                        const hasEdit = editValue !== undefined;
                        const exceedsMax =
                            hasEdit && editValue > skid.initial_total_cartons;

                        return (
                            <tr
                                key={skid.id}
                                className="border-b last:border-b-0 hover:bg-gray-50/60 transition-colors"
                            >
                                <td className="px-4 py-3 font-mono text-xs text-gray-700">
                                    {skid.skid_id}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                    {skid.initial_total_cartons.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                    {skid.cartons_remaining_last_update.toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col items-end gap-1">
                                        <Input
                                            type="number"
                                            min={0}
                                            step={1}
                                            placeholder="—"
                                            value={hasEdit ? editValue : ""}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === "") {
                                                    onEdit(skid.id, undefined);
                                                    return;
                                                }
                                                const parsed = parseInt(raw, 10);
                                                if (!isNaN(parsed) && parsed >= 0) {
                                                    onEdit(skid.id, parsed);
                                                }
                                            }}
                                            className={cn(
                                                "w-32 text-right h-8 text-sm",
                                                exceedsMax
                                                    ? "border-red-400 focus-visible:ring-red-400"
                                                    : hasEdit
                                                    ? "border-primary/60 focus-visible:ring-primary/40"
                                                    : "",
                                            )}
                                        />
                                        {exceedsMax && (
                                            <p className="text-xs text-red-600 text-right">
                                                Cannot exceed{" "}
                                                {skid.initial_total_cartons.toLocaleString()}{" "}
                                                cartons.
                                            </p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

interface OrderRowProps {
    order: Order;
    edits: SkidEdits;
    onEdit: (skidId: string, value: number | undefined) => void;
}

function OrderRow({ order, edits, onEdit }: OrderRowProps) {
    const [expanded, setExpanded] = useState(false);
    const totalSkids = order.skids.length;

    return (
        <div className="border-b last:border-b-0">
            {/* Row header */}
            <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
                {expanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                )}

                {order.is_envelope_order ? (
                    /* Envelope order — no advertiser / category */
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                            <Layers className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span className="text-xs font-semibold text-amber-700">
                                Envelope
                            </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">
                            {order.name}
                        </span>
                    </div>
                ) : (
                    /* Standalone order */
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate min-w-[120px]">
                            {order.advertiser}
                        </span>
                        <span className="text-xs text-gray-500 truncate hidden sm:block">
                            {order.category}
                        </span>
                    </div>
                )}

                <div className="shrink-0 ml-auto">
                    {skidCount(totalSkids)}
                </div>
            </button>

            {/* Skid-label warning */}
            {order.skid_label_warning && (
                <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                    <span>
                        Warning: Skids will arrive without Skid ID labels and will need
                        to be labeled onsite.
                    </span>
                </div>
            )}

            {/* Skid table */}
            {expanded && (
                <SkidTable skids={order.skids} edits={edits} onEdit={onEdit} />
            )}
        </div>
    );
}

// ─── Booking Month Accordion ──────────────────────────────────────────────────

interface BookingMonthAccordionProps {
    month: BookingMonth;
    isExpanded: boolean;
    onToggle: () => void;
    edits: SkidEdits;
    onEdit: (skidId: string, value: number | undefined) => void;
}

function BookingMonthAccordion({
    month,
    isExpanded,
    onToggle,
    edits,
    onEdit,
}: BookingMonthAccordionProps) {
    return (
        <div className="border rounded-xl overflow-hidden mb-3 bg-white shadow-sm">
            {/* Accordion header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span className="font-semibold text-gray-900">
                        {month.booking_month}
                    </span>
                    {statusBadge(month.status)}
                </div>
                <div className="shrink-0 ml-4">
                    {skidCount(month.total_skids)}
                </div>
            </button>

            {/* Orders list */}
            {isExpanded && (
                <div className="border-t divide-y divide-gray-100">
                    {month.orders.length === 0 ? (
                        <p className="px-5 py-6 text-sm text-gray-400 text-center">
                            No orders for this month.
                        </p>
                    ) : (
                        month.orders.map((order) => (
                            <OrderRow
                                key={order.id}
                                order={order}
                                edits={edits}
                                onEdit={onEdit}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ─── DC Selector ──────────────────────────────────────────────────────────────

interface DCSelectorProps {
    centers: DistributionCenter[];
    selectedId: string;
    onChange: (id: string) => void;
}

function DCSelector({ centers, selectedId, onChange }: DCSelectorProps) {
    if (centers.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {centers.map((dc) => (
                <button
                    key={dc.salesforce_distribution_center_id}
                    onClick={() => onChange(dc.salesforce_distribution_center_id)}
                    className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                        selectedId === dc.salesforce_distribution_center_id
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-primary/5",
                    )}
                >
                    {dc.name}
                </button>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function InventoryPage() {
    const [centers, setCenters] = useState<DistributionCenter[]>([]);
    const [selectedDcId, setSelectedDcId] = useState<string>("");
    const [bookingMonths, setBookingMonths] = useState<BookingMonth[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
        new Set(),
    );
    // skid.id → user-entered value
    const [edits, setEdits] = useState<SkidEdits>({});

    const [callCenters, { loading: loadingCenters }] = useApi({ errMsg: true });
    const [callInventory, { loading: loadingInventory }] = useApi({
        errMsg: true,
    });
    const [callSubmit, { loading: submitting }] = useApi({ errMsg: true });

    // ── Load distribution centers once on mount ──
    useEffect(() => {
        callCenters(
            getAuthorizedDistributionCentersApi(),
            ({ data }: any) => {
                const dcs: DistributionCenter[] =
                    data?.distribution_centers ?? [];
                setCenters(dcs);
                if (dcs.length > 0) {
                    setSelectedDcId(
                        dcs[0].salesforce_distribution_center_id,
                    );
                }
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Load inventory whenever selected DC changes ──
    const loadInventory = useCallback(
        (dcId: string) => {
            if (!dcId) return;
            setBookingMonths([]);
            setExpandedMonths(new Set());
            setEdits({});
            callInventory(
                getDistributionCenterInventoryApi(dcId),
                ({ data }: any) => {
                    setBookingMonths(data?.booking_months ?? []);
                },
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        if (selectedDcId) loadInventory(selectedDcId);
    }, [selectedDcId, loadInventory]);

    // ── Edit handler ──
    const handleEdit = (skidId: string, value: number | undefined) => {
        setEdits((prev) => {
            const next = { ...prev };
            if (value === undefined) {
                delete next[skidId];
            } else {
                next[skidId] = value;
            }
            return next;
        });
    };

    // ── Validate edits: none may exceed initial_total_cartons ──
    const hasValidationErrors = (() => {
        for (const month of bookingMonths) {
            for (const order of month.orders) {
                for (const skid of order.skids) {
                    const v = edits[skid.id];
                    if (v !== undefined && v > skid.initial_total_cartons) {
                        return true;
                    }
                }
            }
        }
        return false;
    })();

    const editedSkidIds = Object.keys(edits);
    const canSubmit =
        editedSkidIds.length > 0 && !hasValidationErrors && !submitting;

    // ── Submit ──
    const handleSubmit = () => {
        if (!canSubmit) return;

        const allUpdates = editedSkidIds.map((skidId) => ({
            skid_id: skidId,
            cartons_remaining: edits[skidId],
        }));

        // Chunk into batches no larger than COMPOSITE_MAX_RECORDS
        const chunks: typeof allUpdates[] = [];
        for (let i = 0; i < allUpdates.length; i += COMPOSITE_MAX_RECORDS) {
            chunks.push(allUpdates.slice(i, i + COMPOSITE_MAX_RECORDS));
        }

        const submitChunks = (remaining: typeof chunks) => {
            if (remaining.length === 0) {
                toast.success("Skid updates submitted successfully.");
                loadInventory(selectedDcId);
                return;
            }
            const [head, ...tail] = remaining;
            callSubmit(
                submitSkidUpdatesApi({ updates: head }),
                () => submitChunks(tail),
            );
        };

        submitChunks(chunks);
    };

    // ── Toggle month expansion ──
    const toggleMonth = (monthKey: string) => {
        setExpandedMonths((prev) => {
            const next = new Set(prev);
            if (next.has(monthKey)) next.delete(monthKey);
            else next.add(monthKey);
            return next;
        });
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    const isLoadingCenters = loadingCenters;
    const isLoadingInventory = loadingInventory;

    return (
        <main className="container mx-auto px-4 py-8">
            {/* Page title */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Update carton counts for your distribution centers.
                </p>
            </div>

            {/* DC Selector */}
            {isLoadingCenters ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading distribution centers…
                </div>
            ) : centers.length === 0 ? (
                <div className="mb-6 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                    <Package2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                        No distribution centers are assigned to your account.
                    </p>
                </div>
            ) : (
                <div className="mb-6 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Distribution Center
                    </p>
                    <DCSelector
                        centers={centers}
                        selectedId={selectedDcId}
                        onChange={(id) => setSelectedDcId(id)}
                    />
                </div>
            )}

            {/* Inventory content */}
            {selectedDcId && (
                <>
                    {isLoadingInventory ? (
                        <div className="flex items-center justify-center py-16 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span className="text-sm">Loading inventory…</span>
                        </div>
                    ) : bookingMonths.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
                            <Package2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">
                                No active booking months for this distribution center.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Booking month accordions */}
                            <div className="mb-6">
                                {bookingMonths.map((month) => (
                                    <BookingMonthAccordion
                                        key={month.booking_month}
                                        month={month}
                                        isExpanded={expandedMonths.has(
                                            month.booking_month,
                                        )}
                                        onToggle={() =>
                                            toggleMonth(month.booking_month)
                                        }
                                        edits={edits}
                                        onEdit={handleEdit}
                                    />
                                ))}
                            </div>

                            {/* Submit bar */}
                            <div className="sticky bottom-4 z-20">
                                <div className="bg-white border rounded-xl shadow-md px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="text-sm text-gray-600">
                                        {editedSkidIds.length === 0 ? (
                                            <span className="text-gray-400">
                                                No skids edited yet.
                                            </span>
                                        ) : (
                                            <span>
                                                <span className="font-semibold text-gray-900">
                                                    {editedSkidIds.length}
                                                </span>{" "}
                                                skid
                                                {editedSkidIds.length !== 1
                                                    ? "s"
                                                    : ""}{" "}
                                                edited
                                                {hasValidationErrors && (
                                                    <span className="ml-2 text-red-600 font-medium">
                                                        — fix errors before
                                                        submitting
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!canSubmit}
                                        className="bg-blue-gradient text-white px-6 h-9 text-sm font-medium"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Submitting…
                                            </>
                                        ) : (
                                            "Submit Updates"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </main>
    );
}
