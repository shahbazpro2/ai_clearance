"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
    ChevronLeft,
    AlertTriangle,
    Package2,
    Loader2,
    Layers,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    brand: string | null;
    skid_label_warning: boolean;
    skids: Skid[];
    children?: Order[];
}

interface BookingMonth {
    booking_month: string;
    status: "not_started" | "in_progress";
    total_skids: number;
    orders: Order[];
}

interface InventoryPagination {
    has_next: boolean;
    has_previous: boolean;
    page: number;
    page_size: number;
    returned_groups: number;
    scope: string;
    total_groups: number;
    total_pages: number;
}

// Map of skid.id → user-entered cartons_remaining value
type SkidEdits = Record<string, number>;

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPOSITE_MAX_RECORDS = 200;
const SELECTED_DC_STORAGE_KEY = "inventory:selected-distribution-center";

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

// Flattens an order's own skids plus skids from its child orders (envelope
// parent orders) so edits/badges cover all editable skids.
function allSkids(order: Order): Skid[] {
    return [
        ...(order.skids ?? []),
        ...(order.children ?? []).flatMap((child) => child.skids ?? []),
    ];
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
                                className={cn(
                                    "border-b last:border-b-0 transition-colors",
                                    hasEdit && !exceedsMax
                                        ? "bg-blue-50/60"
                                        : "hover:bg-gray-50/60",
                                )}
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

// ─── Child Order Card (collapsible) ────────────────────────────────────────────

interface ChildOrderCardProps {
    child: Order;
    edits: SkidEdits;
    onEdit: (skidId: string, value: number | undefined) => void;
    expanded: boolean;
    onToggle: () => void;
}

function ChildOrderCard({
    child,
    edits,
    onEdit,
    expanded,
    onToggle,
}: ChildOrderCardProps) {
    const childSkids = child.skids ?? [];
    const editedCount = childSkids.filter(
        (skid) => edits[skid.id] !== undefined,
    ).length;

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Header — click to expand/collapse */}
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors group"
            >
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200",
                        !expanded && "-rotate-90",
                    )}
                />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                        {child.name}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {editedCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap">
                            {editedCount} edited
                        </span>
                    )}
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap tabular-nums">
                        {childSkids.length} skid
                        {childSkids.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </button>

            {/* Collapsible body — animates via grid-template-rows */}
            <div
                className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
            >
                <div className="overflow-hidden min-h-0">
                    {childSkids.length > 0 ? (
                        <SkidTable
                            skids={childSkids}
                            edits={edits}
                            onEdit={onEdit}
                        />
                    ) : (
                        <div className="px-4 py-4 text-sm text-gray-400 border-t">
                            No skids for this child order.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Child Orders Section ─────────────────────────────────────────────────────

interface ChildOrdersSectionProps {
    order: Order;
    edits: SkidEdits;
    onEdit: (skidId: string, value: number | undefined) => void;
}

function ChildOrdersSection({ order, edits, onEdit }: ChildOrdersSectionProps) {
    const children = order.children ?? [];
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    const allExpanded = collapsedIds.size === 0;

    const toggleChild = (id: string) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        setCollapsedIds(
            allExpanded ? new Set(children.map((c) => c.id)) : new Set(),
        );
    };

    return (
        <div className="border-t bg-gray-50">
            {/* Section header */}
            <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                        <Layers className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">
                            Child Orders
                        </h3>
                        <p className="text-xs text-gray-400">
                            {children.length} order
                            {children.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-semibold text-primary hover:underline transition-colors shrink-0"
                >
                    {allExpanded ? "Collapse all" : "Expand all"}
                </button>
            </div>

            {/* Child cards */}
            <div className="px-4 pb-5 space-y-2">
                {children.map((child) => (
                    <ChildOrderCard
                        key={child.id}
                        child={child}
                        edits={edits}
                        onEdit={onEdit}
                        expanded={!collapsedIds.has(child.id)}
                        onToggle={() => toggleChild(child.id)}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Skid Drawer ─────────────────────────────────────────────────────────────

interface SkidDrawerProps {
    order: Order | null;
    open: boolean;
    edits: SkidEdits;
    onEdit: (skidId: string, value: number | undefined) => void;
    onClose: () => void;
}

function SkidDrawer({ order, open, edits, onEdit, onClose }: SkidDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:w-[680px] max-w-full p-0 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <SheetTitle className="text-lg font-bold text-gray-900">
                        Skids
                    </SheetTitle>
                    {order && (
                        <div className="flex items-center gap-2 mt-0.5">
                            {order.is_envelope_order ? (
                                <>
                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                                        <Layers className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                        <span className="text-xs font-semibold text-amber-700">
                                            Envelope
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">
                                        {order.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-sm font-medium text-gray-700">
                                    {order.brand}
                                </span>
                            )}
                        </div>
                    )}
                </SheetHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {order && order.skids.length > 0 ? (
                        <SkidTable
                            skids={order.skids}
                            edits={edits}
                            onEdit={onEdit}
                        />
                    ) : (
                        <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                            No skids for this order.
                        </div>
                    )}

                    {/* Child Orders — only shown for Parent Envelope Orders that
                        include child records in the API response */}
                    {order?.is_envelope_order &&
                        order.children &&
                        order.children.length > 0 && (
                            <ChildOrdersSection
                                key={order.id}
                                order={order}
                                edits={edits}
                                onEdit={onEdit}
                            />
                        )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ─── Order Row ────────────────────────────────────────────────────────────────

interface OrderRowProps {
    order: Order;
    edits: SkidEdits;
    onOpen: (order: Order) => void;
}

function OrderRow({ order, edits, onOpen }: OrderRowProps) {
    const totalSkids = order.skids.length;
    const hasSkids =
        totalSkids > 0 ||
        (order.is_envelope_order &&
            (order.children?.some(
                (child) => (child.skids ?? []).length > 0,
            ) ??
                false));
    const editedCount = allSkids(order).filter(
        (skid) => edits[skid.id] !== undefined,
    ).length;

    return (
        <div className="border-b last:border-b-0">
            <button
                onClick={() => hasSkids && onOpen(order)}
                disabled={!hasSkids}
                className="group w-full flex items-center gap-3 px-4 py-3 enabled:hover:bg-gray-50 transition-colors text-left disabled:cursor-default disabled:opacity-60"
                aria-label={
                    hasSkids
                        ? `View skids for ${order.is_envelope_order ? order.name : order.brand || order.name}`
                        : undefined
                }
            >
                {/* Skid-label warning icon — moved to the left */}
                {order.skid_label_warning && (
                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span
                                    className="inline-flex items-center justify-center text-amber-500 hover:text-amber-600 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                                Skids will arrive without Skid ID labels and will need
                                to be labeled onsite.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {skidCount(totalSkids)}

                {/* View affordance — only shown when the order has skids */}
                {hasSkids && (
                    <span className="text-sm font-semibold text-primary shrink-0 transition-colors group-hover:underline">
                        View
                    </span>
                )}

                {order.is_envelope_order ? (
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
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 truncate min-w-[100px]">
                            {order.name}
                        </span>
                        <span className="text-sm font-medium text-gray-700 truncate min-w-[120px] hidden sm:block">
                            {order.brand}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {/* Edited badge with popup — shows the changed values on hover */}
                    {editedCount > 0 && (
                        <TooltipProvider delayDuration={150}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap cursor-help">
                                        {editedCount} edited
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs">
                                    <div className="space-y-1">
                                        {allSkids(order).map((skid) => {
                                            const value = edits[skid.id];
                                            if (value === undefined) return null;
                                            return (
                                                <div
                                                    key={skid.id}
                                                    className="flex items-center justify-between gap-3"
                                                >
                                                    <span className="font-mono font-medium text-gray-900">
                                                        {skid.skid_id}
                                                    </span>
                                                    <span className="text-gray-500 whitespace-nowrap">
                                                        {skid.cartons_remaining_last_update.toLocaleString()}
                                                        <span className="text-gray-400 mx-1">→</span>
                                                        {value.toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </button>
        </div>
    );
}

// ─── Booking Month Accordion ──────────────────────────────────────────────────

interface BookingMonthAccordionProps {
    month: BookingMonth;
    isExpanded: boolean;
    edits: SkidEdits;
    onToggle: () => void;
    onOpenOrder: (order: Order) => void;
}

function BookingMonthAccordion({
    month,
    isExpanded,
    edits,
    onToggle,
    onOpenOrder,
}: BookingMonthAccordionProps) {
    const editedCount = month.orders.reduce(
        (sum, order) =>
            sum +
            allSkids(order).filter(
                (skid) => edits[skid.id] !== undefined,
            ).length,
        0,
    );

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
                    {/* Skid count — moved to the left */}
                    {skidCount(month.total_skids)}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                    {/* Edited badge with popup — same as order rows, shows changed values on hover */}
                    {editedCount > 0 && (
                        <TooltipProvider delayDuration={150}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 whitespace-nowrap cursor-help">
                                        {editedCount} edited
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs">
                                    <div className="space-y-1">
                                        {month.orders.flatMap((order) =>
                                            allSkids(order).map((skid) => {
                                                const value = edits[skid.id];
                                                if (value === undefined) return [];
                                                return [
                                                    <div
                                                        key={skid.id}
                                                        className="flex items-center justify-between gap-3"
                                                    >
                                                        <span className="font-mono font-medium text-gray-900">
                                                            {skid.skid_id}
                                                        </span>
                                                        <span className="text-gray-500 whitespace-nowrap">
                                                            {skid.cartons_remaining_last_update.toLocaleString()}
                                                            <span className="text-gray-400 mx-1">→</span>
                                                            {value.toLocaleString()}
                                                        </span>
                                                    </div>,
                                                ];
                                            }),
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
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
                                onOpen={onOpenOrder}
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
    loading: boolean;
    error: unknown;
    onChange: (id: string) => void;
    onRefresh: () => void;
}

function DCSelector({ centers, selectedId, loading, error, onChange, onRefresh }: DCSelectorProps) {
    return (
        <div className="flex flex-col gap-4">
            {/* Selector card */}
            <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border">
                {/* Distribution Center row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 shrink-0">
                        Distribution Center:
                    </span>
                    {loading && centers.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <LoadingSpinner size="sm" /> Loading distribution centers…
                        </div>
                    ) : (
                        <Select value={selectedId} onValueChange={onChange}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Select a distribution center" />
                            </SelectTrigger>
                            <SelectContent>
                                {centers.map((dc) => (
                                    <SelectItem
                                        key={dc.salesforce_distribution_center_id}
                                        value={dc.salesforce_distribution_center_id}
                                    >
                                        {dc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={onRefresh} disabled={loading} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error state */}
            {!loading && !!error && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <p className="text-sm text-red-600">Failed to load distribution centers.</p>
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && centers.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                    <Package2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                        No distribution centers are assigned to your account.
                    </p>
                </div>
            )}
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
    // Pagination for booking months (the API paginates the list)
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<InventoryPagination | null>(
        null,
    );
    // skid.id → initial_total_cartons, accumulated across pages so validation
    // still catches over-max edits made on other pages
    const skidInitialTotalsRef = useRef<Record<string, number>>({});

    // ── Skid drawer state ──
    const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const openDrawer = (order: Order) => {
        setDrawerOrder(order);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
    };

    const [callCenters, { loading: loadingCenters, error: centersError }] = useApi({ errMsg: true });
    const [callInventory, { loading: loadingInventory }] = useApi({
        errMsg: true,
    });
    const [callSubmit, { loading: submitting }] = useApi({ errMsg: true });

    // ── Load distribution centers once on mount ──
    const loadCenters = useCallback(() => {
        callCenters(
            getAuthorizedDistributionCentersApi(),
            ({ data }: any) => {
                const dcs: DistributionCenter[] =
                    data?.distribution_centers ?? [];
                setCenters(dcs);
                if (dcs.length > 0) {
                    const savedDcId = window.sessionStorage.getItem(
                        SELECTED_DC_STORAGE_KEY,
                    );
                    setSelectedDcId(
                        dcs.some(
                            (dc) =>
                                dc.salesforce_distribution_center_id ===
                                savedDcId,
                        )
                            ? savedDcId!
                            : dcs[0].salesforce_distribution_center_id,
                    );
                } else {
                    setSelectedDcId("");
                }
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadCenters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Load inventory whenever the selected DC or page changes ──
    const loadInventory = useCallback(
        (dcId: string, pageNumber: number = 1) => {
            if (!dcId) return;
            setBookingMonths([]);
            setExpandedMonths(new Set());
            callInventory(
                getDistributionCenterInventoryApi(dcId, {
                    page: pageNumber,
                }),
                ({ data }: any) => {
                    const months = data?.booking_months ?? [];
                    setBookingMonths(months);
                    setPagination(data?.pagination ?? null);
                    // Accumulate skid totals so edits on hidden pages stay validated
                    const totals = { ...skidInitialTotalsRef.current };
                    months.forEach((m: any) =>
                        m.orders?.forEach((o: any) => {
                            o.skids?.forEach((s: any) => {
                                totals[s.id] = s.initial_total_cartons;
                            });
                            // Accumulate child-order skid totals too so edits on
                            // envelope child skids stay validated against their
                            // initial totals.
                            o.children?.forEach((c: any) =>
                                c.skids?.forEach((s: any) => {
                                    totals[s.id] = s.initial_total_cartons;
                                }),
                            );
                        }),
                    );
                    skidInitialTotalsRef.current = totals;
                },
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        if (selectedDcId) loadInventory(selectedDcId, page);
    }, [selectedDcId, page, loadInventory]);

    useEffect(() => {
        if (selectedDcId) {
            window.sessionStorage.setItem(
                SELECTED_DC_STORAGE_KEY,
                selectedDcId,
            );
        }
    }, [selectedDcId]);

    // ── Refresh: reload the DC list (keeping the selection) and reload the
    // inventory for the currently selected DC by passing its value to the API ──
    const handleRefresh = useCallback(() => {
        callCenters(
            getAuthorizedDistributionCentersApi(),
            ({ data }: any) => {
                const dcs: DistributionCenter[] =
                    data?.distribution_centers ?? [];
                setCenters(dcs);
                // Preserve the current selection when the list reloads
                if (dcs.length > 0) {
                    setSelectedDcId((prev) =>
                        dcs.some(
                            (dc) =>
                                dc.salesforce_distribution_center_id === prev,
                        )
                            ? prev
                            : dcs[0].salesforce_distribution_center_id,
                    );
                }
            },
        );
        // Pass the selected DC value to the inventory API so fresh data loads for it
        if (selectedDcId) {
            loadInventory(selectedDcId, page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDcId, page]);

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

    // ── DC change: reset to page 1, clear edits + accumulated totals for the new DC ──
    const handleDcChange = (id: string) => {
        setSelectedDcId(id);
        setPage(1);
        setEdits({});
        skidInitialTotalsRef.current = {};
    };

    // ── Page change: keep edits, request the new page ──
    const handlePageChange = (nextPage: number) => {
        if (nextPage < 1) return;
        setPage(nextPage);
    };

    // ── Validate edits against initial totals (accumulated across all pages) ──
    const editedSkidIds = Object.keys(edits);
    const hasValidationErrors = editedSkidIds.some((skidId) => {
        const value = edits[skidId];
        const initial = skidInitialTotalsRef.current[skidId];
        return (
            value !== undefined &&
            initial !== undefined &&
            value > initial
        );
    });
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
                setEdits({});
                loadInventory(selectedDcId, page);
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
            <div className="mb-6">
                <DCSelector
                    centers={centers}
                    selectedId={selectedDcId}
                    loading={isLoadingCenters}
                    error={centersError}
                    onChange={handleDcChange}
                    onRefresh={handleRefresh}
                />
            </div>

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
                                        edits={edits}
                                        onToggle={() =>
                                            toggleMonth(month.booking_month)
                                        }
                                        onOpenOrder={openDrawer}
                                    />
                                ))}

                                {/* Pagination — booking months are paginated by the API */}
                                {pagination && pagination.total_pages > 1 && (
                                    <div className="mt-3 flex items-center justify-between px-5 py-3 border rounded-xl bg-white shadow-sm">
                                        <p className="text-sm text-gray-600">
                                            Page {pagination.page} of{" "}
                                            {pagination.total_pages} (
                                            {pagination.total_groups} booking
                                            month
                                            {pagination.total_groups === 1
                                                ? ""
                                                : "s"}
                                            )
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.page - 1,
                                                    )
                                                }
                                                disabled={
                                                    !pagination.has_previous ||
                                                    isLoadingInventory
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() =>
                                                    handlePageChange(
                                                        pagination.page + 1,
                                                    )
                                                }
                                                disabled={
                                                    !pagination.has_next ||
                                                    isLoadingInventory
                                                }
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
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

            {/* Skid drawer */}
            <SkidDrawer
                order={drawerOrder}
                open={drawerOpen}
                edits={edits}
                onEdit={handleEdit}
                onClose={closeDrawer}
            />
        </main>
    );
}
