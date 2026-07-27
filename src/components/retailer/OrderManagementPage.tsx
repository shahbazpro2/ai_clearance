"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "use-hook-api";
import { getChannelOrdersApi } from "@/api/retailer";
import { useAudienceChannel } from "@/hooks/useAudienceChannel";
import { AudienceChannelSelector } from "@/components/retailer/AudienceChannelSelector";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
    id: string;
    order_id?: string;
    order: string;
    type: "collated_envelope_parent" | "collated_envelope_child" | "normal_order";
    advertiser: string | null;
    category: string | null;
    qty_booked: number;
    pacing_visualization: number;
    manual_distributed: number;
    rfid_distributed: number;
    cpm: number | null;
    total: number | null;
    payment_status: string;
    conversions: number | null;
    cac: number | null;
    children?: Order[];
}

interface MonthSummary {
    paid_amount: number;
    status: string;
    total_amount: number;
}

interface Month {
    booking_month: string;
    orders: Order[];
    summary: MonthSummary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonth(ym: string): string {
    const [year, month] = ym.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatNumber(n: number | null): string {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat("en-US").format(n);
}

function statusBadgeClass(status: string): string {
    const s = status?.toLowerCase() ?? "";
    if (s === "complete" || s === "completed") return "bg-green-100 text-green-700";
    if (s.includes("progress")) return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-500";
}

function paymentBadgeClass(status: string): string {
    if (status === "Paid") return "bg-green-100 text-green-700 border border-green-200";
    if (status === "Unpaid") return "bg-red-100 text-red-700 border border-red-200";
    return "bg-gray-100 text-gray-500";
}

// ─── Order Row ────────────────────────────────────────────────────────────────

interface OrderRowProps {
    order: Order;
    isChild?: boolean;
    expandedEnvelopes: Set<string>;
    onToggleEnvelope: (id: string) => void;
    onOpenSkids: (order: Order) => void;
}

function OrderRow({ order, isChild = false, expandedEnvelopes, onToggleEnvelope, onOpenSkids }: OrderRowProps) {
    const isEnvelope = order.type === "collated_envelope_parent";
    const isExpanded = expandedEnvelopes.has(order.id);
    const qtyDist = order.manual_distributed ?? 0
    const rfidDist = order.rfid_distributed ?? 0
    const pacing = Math.min(Math.max(order.pacing_visualization ?? 0, 0), 100);
    const shouldHideChildEnvelopeMetrics = isChild;

    return (
        <>
            <tr className={cn("border-b last:border-0", isChild ? "bg-gray-50/70" : "bg-white hover:bg-gray-50/50")}>
                {/* ORDER */}
                <td className={cn("px-4 py-3 text-sm font-semibold whitespace-nowrap", isChild && "pl-10")}>
                    <button
                        onClick={() => onOpenSkids(order)}
                        className="font-semibold text-red-600 hover:text-red-700 hover:underline"
                    >
                        {order.order}
                    </button>
                </td>

                {/* ADVERTISER */}
                <td className="px-4 py-3 text-sm text-gray-700">
                    {isEnvelope ? (
                        <button
                            onClick={() => onToggleEnvelope(order.id)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors select-none"
                        >
                            <span className="text-gray-400">◄</span>
                            <span>ENVELOPE</span>
                            <span className="text-gray-400">►</span>
                        </button>
                    ) : (
                        <span>{order.advertiser ?? "—"}</span>
                    )}
                </td>

                {/* CATEGORY */}
                <td className="px-4 py-3 text-sm text-gray-600">{order.category ?? "—"}</td>

                {/* QTY */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatNumber(order.qty_booked)}
                </td>

                {/* PACING */}
                <td className="px-4 py-3">
                    {shouldHideChildEnvelopeMetrics ? (
                        "—"
                    ) : (
                        <div className="w-28">
                            <div className="text-xs text-gray-500 mb-1">{Math.round(pacing)}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${pacing}%` }}
                                />
                            </div>
                        </div>
                    )}
                </td>

                {/* QTY DIST. */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {shouldHideChildEnvelopeMetrics ? "—" : formatNumber(qtyDist)}
                </td>

                {/* RFID */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {shouldHideChildEnvelopeMetrics ? "—" : formatNumber(rfidDist)}
                </td>

                {/* CPM */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {order.cpm != null ? `$${order.cpm}` : "—"}
                </td>

                {/* TOTAL */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {formatCurrency(order.total)}
                </td>

                {/* PAYMENT */}
                <td className="px-4 py-3 text-sm">
                    {order.payment_status ? (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded", paymentBadgeClass(order.payment_status))}>
                            {order.payment_status}
                        </span>
                    ) : (
                        "—"
                    )}
                </td>

                {/* CONVERSIONS */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {order.conversions != null ? formatNumber(order.conversions) : "—"}
                </td>

                {/* CAC */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {order.cac != null ? `$${order.cac}` : "—"}
                </td>
            </tr>

            {isEnvelope && isExpanded && order.children?.map((child) => (
                <OrderRow
                    key={child.id}
                    order={child}
                    isChild
                    expandedEnvelopes={expandedEnvelopes}
                    onToggleEnvelope={onToggleEnvelope}
                    onOpenSkids={onOpenSkids}
                />
            ))}
        </>
    );
}

// ─── Month Accordion ──────────────────────────────────────────────────────────

interface MonthAccordionProps {
    month: Month;
    isExpanded: boolean;
    onToggle: () => void;
    onOpenSkids: (order: Order) => void;
}

function MonthAccordion({ month, isExpanded, onToggle, onOpenSkids }: MonthAccordionProps) {
    const [expandedEnvelopes, setExpandedEnvelopes] = useState<Set<string>>(new Set());

    const toggleEnvelope = (id: string) => {
        setExpandedEnvelopes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Only top-level orders (children are embedded inside parent rows)
    const topLevelOrders = month.orders.filter((o) => o.type !== "collated_envelope_child");

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        setExpandedEnvelopes(
            new Set(
                month.orders
                    .filter((order) => order.type === "collated_envelope_parent")
                    .map((order) => order.id)
            )
        );
    }, [isExpanded, month.orders]);

    return (
        <div className="border rounded-xl overflow-hidden mb-3 bg-white">
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
                    <span className="font-semibold text-gray-900">{formatMonth(month.booking_month)}</span>
                    <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide", statusBadgeClass(month.summary.status))}>
                        {month.summary.status}
                    </span>
                </div>
                <div className="text-right shrink-0 ml-4">
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(month.summary.total_amount)}</div>
                    <div className="text-xs text-green-600 font-medium">{formatCurrency(month.summary.paid_amount)} Paid</div>
                </div>
            </button>

            {/* Orders table */}
            {isExpanded && (
                <div className="border-t overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Advertiser</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quantity Booked</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pacing</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Qty Distributed (Manual)</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Qty Distributed (RFID)</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">CPM</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Conversions</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">CAC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topLevelOrders.map((order) => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    expandedEnvelopes={expandedEnvelopes}
                                    onToggleEnvelope={toggleEnvelope}
                                    onOpenSkids={onOpenSkids}
                                />
                            ))}
                            {topLevelOrders.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-400">
                                        No orders for this month.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OrderManagementPage() {
    const router = useRouter();
    const {
        audiences,
        selectedAudienceId,
        selectedChannelId,
        selectedAudience,
        loading: loadingStats,
        error,
        setSelectedChannelId,
        handleAudienceChange,
        refresh,
    } = useAudienceChannel("order-management");

    const [months, setMonths] = useState<Month[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const [callOrders, { loading: loadingOrders }] = useApi({ errMsg: true });

    useEffect(() => {
        if (!selectedChannelId) return;
        setMonths([]);
        callOrders(getChannelOrdersApi(selectedChannelId), ({ data }: any) => {
            const m: Month[] = data?.months ?? [];
            setMonths(m);
            setExpandedMonths(new Set());
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChannelId]);

    const toggleMonth = (bookingMonth: string) => {
        setExpandedMonths((prev) => {
            const next = new Set(prev);
            if (next.has(bookingMonth)) next.delete(bookingMonth);
            else next.add(bookingMonth);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedMonths(new Set(months.map((m) => m.booking_month)));
    };

    const collapseAll = () => {
        setExpandedMonths(new Set());
    };

    const openSkids = (order: Order) => {
        const orderId = order.order_id ?? order.id;
        window.sessionStorage.setItem("retailer:selected-order", JSON.stringify(order));
        router.push(`/retailer/order-management/orders/${encodeURIComponent(orderId)}/skids`);
    };

    // Group months by year, sorted descending
    const monthsByYear = [...months]
        .sort((a, b) => b.booking_month.localeCompare(a.booking_month))
        .reduce<Record<string, Month[]>>((acc, month) => {
            const year = month.booking_month.split("-")[0];
            if (!acc[year]) acc[year] = [];
            acc[year].push(month);
            return acc;
        }, {});
    const years = Object.keys(monthsByYear).sort((a, b) => parseInt(b) - parseInt(a));

    return (
        <div className="container mx-auto px-4 py-8">
            {!loadingStats && audiences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                        <ClipboardList className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">No Audience Data Available</h2>
                    <p className="text-sm text-gray-500 max-w-sm">
                        This section will become available once account setup is complete.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            View and track orders by audience and channel, grouped by month.
                        </p>
                    </div>

                    <div className="mb-6">
                        <AudienceChannelSelector
                            audiences={audiences}
                            selectedAudienceId={selectedAudienceId}
                            selectedChannelId={selectedChannelId}
                            selectedAudience={selectedAudience}
                            loading={loadingStats}
                            error={error}
                            onAudienceChange={handleAudienceChange}
                            onChannelChange={setSelectedChannelId}
                            onRefresh={refresh}
                        />
                    </div>

                    {/* Orders section */}
                    {loadingOrders || loadingStats ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner className="h-6 w-6" />
                        </div>
                    ) : !selectedChannelId ? (
                        <div className="text-center py-20 text-gray-400 text-sm">
                            Select an audience and channel to view orders.
                        </div>
                    ) : months.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 text-sm">
                            No orders found for this channel.
                        </div>
                    ) : (
                        <div>
                            {/* Bulk actions */}
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={expandAll}
                                    className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Expand all
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Collapse all
                                </button>
                            </div>
                            {years.map((year) => (
                                <div key={year} className="mb-6">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">
                                        {year}
                                    </div>
                                    {monthsByYear[year].map((month) => (
                                        <MonthAccordion
                                            key={month.booking_month}
                                            month={month}
                                            isExpanded={expandedMonths.has(month.booking_month)}
                                            onToggle={() => toggleMonth(month.booking_month)}
                                            onOpenSkids={openSkids}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
