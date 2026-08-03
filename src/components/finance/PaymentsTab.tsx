"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, MoreHorizontal } from "lucide-react";
import { useApi } from "use-hook-api";
import { fetchPaymentsApi, type PaymentGroup, type PaymentOrderRecord, type PaymentsPagination } from "@/api/finance";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface PaymentsTabProps {
    channelIds: string[];
}

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const PAYMENTS_COLUMNS: { key: keyof PaymentOrderRecord; label: string; className?: string; headerClassName?: string }[] = [
    { key: "order", label: "Order" },
    { key: "advertiser", label: "Advertiser" },
    { key: "audience", label: "Audience" },
    { key: "channel", label: "Channel" },
    { key: "booking_month", label: "Booking Month" },
    { key: "qty_booked", label: "Quantity Booked", className: "text-right", headerClassName: "text-right" },
    { key: "cpm", label: "CPM", className: "text-right", headerClassName: "text-right" },
    { key: "total", label: "Total", className: "text-right font-semibold", headerClassName: "text-right" },
];

function formatCurrency(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(value);
}

function formatNumber(value: number | null): string {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return new Intl.NumberFormat("en-US").format(value);
}

function formatMonth(ym: string | null | undefined): string {
    if (!ym) return "—";
    try {
        const [y, m] = ym.split("-");
        if (!y || !m) return ym;
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
        return ym;
    }
}

function statusBadgeClass(isPaid: boolean): string {
    return isPaid
        ? "bg-green-100 text-green-700"
        : "bg-amber-100 text-amber-700";
}

function calculateGroupTotal(group: PaymentGroup): number {
    return group.orders.reduce((sum, order) => sum + (order.total || 0), 0);
}

export function PaymentsTab({ channelIds }: PaymentsTabProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [groups, setGroups] = useState<PaymentGroup[]>([]);
    const [pagination, setPagination] = useState<PaymentsPagination | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    const [callApi, { loading: isLoading }] = useApi({ both: false });

    const channelIdsKey = channelIds.join(",");

    const fetchPayments = () => {
        if (channelIds.length === 0) {
            setGroups([]);
            setPagination(null);
            setExpandedGroups(new Set());
            return;
        }

        callApi(
            fetchPaymentsApi({
                channel_ids: channelIds,
                page,
                page_size: pageSize,
            }),
            ({ data }: any) => {
                const fetchedGroups: PaymentGroup[] = data?.groups || [];
                setGroups(fetchedGroups);
                setPagination(data?.pagination || null);
                setExpandedGroups(new Set());
            }
        );
    };

    useEffect(() => {
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelIdsKey, pageSize]);

    useEffect(() => {
        fetchPayments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelIdsKey, page, pageSize]);

    const toggleGroup = (index: number) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedGroups(new Set(groups.map((_, i) => i)));
    };

    const collapseAll = () => {
        setExpandedGroups(new Set());
    };

    const handlePageSizeChange = (newSize: string) => {
        setPageSize(parseInt(newSize, 10));
    };

    const totalGroups = pagination?.total_groups || 0;
    const totalPages = pagination?.total_pages || 0;
    const hasNext = pagination?.has_next || false;
    const hasPrev = pagination?.has_previous || false;

    const startGroup = totalGroups > 0 ? (page - 1) * pageSize + 1 : 0;
    const endGroup = Math.min(page * pageSize, totalGroups);

    // Group payment groups by paid year (paid groups) + "Unpaid" bucket, descending
    const groupsByBucket = useMemo(() => {
        const buckets: Record<string, { label: string; groups: (PaymentGroup & { __index: number })[] }> = {};
        groups.forEach((group, idx) => {
            let key: string;
            if (group.is_paid && group.paid_date) {
                const year = new Date(group.paid_date).getFullYear().toString();
                key = year;
                if (!buckets[key]) buckets[key] = { label: year, groups: [] };
            } else {
                key = "__unpaid__";
                if (!buckets[key]) buckets[key] = { label: "Unpaid", groups: [] };
            }
            buckets[key].groups.push({ ...group, __index: idx });
        });
        const bucketKeys = Object.keys(buckets).sort((a, b) => {
            if (a === "__unpaid__") return 1;
            if (b === "__unpaid__") return -1;
            return parseInt(b) - parseInt(a);
        });
        return bucketKeys.map((k) => buckets[k]);
    }, [groups]);

    const renderPaginationButtons = () => {
        const buttons: (number | "ellipsis")[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) buttons.push(i);
        } else {
            if (page <= 4) {
                for (let i = 1; i <= 5; i++) buttons.push(i);
                buttons.push("ellipsis");
                buttons.push(totalPages);
            } else if (page >= totalPages - 3) {
                buttons.push(1);
                buttons.push("ellipsis");
                for (let i = totalPages - 4; i <= totalPages; i++) buttons.push(i);
            } else {
                buttons.push(1);
                buttons.push("ellipsis");
                for (let i = page - 1; i <= page + 1; i++) buttons.push(i);
                buttons.push("ellipsis");
                buttons.push(totalPages);
            }
        }
        return buttons;
    };

    return (
        <div className="space-y-4">
            {isLoading && groups.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner className="h-6 w-6" />
                </div>
            ) : channelIds.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">
                    Select an audience and channel to view payments.
                </div>
            ) : groups.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">
                    No payment records found for the selected filters.
                </div>
            ) : (
                <>
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
                        <div className="ml-auto text-sm text-gray-500">
                            {totalGroups > 0
                                ? `Showing groups ${startGroup}–${endGroup} of ${formatNumber(totalGroups)}`
                                : "Loading…"}
                        </div>
                    </div>

                    {groupsByBucket.map((bucket) => (
                        <div key={bucket.label} className="mb-6 last:mb-0">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">
                                {bucket.label}
                            </div>
                            {bucket.groups.map((group) => {
                                const isExpanded = expandedGroups.has(group.__index);
                                const groupTotal = calculateGroupTotal(group);

                                return (
                                    <div
                                        key={`${group.paid_date || "unpaid"}-${group.__index}`}
                                        className={cn(
                                            "border rounded-xl overflow-hidden mb-3 bg-white",
                                            !group.is_paid && "border-amber-200"
                                        )}
                                    >
                                        {/* Accordion header */}
                                        <button
                                            onClick={() => toggleGroup(group.__index)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left",
                                                !group.is_paid && "bg-amber-50/50 hover:bg-amber-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                                                )}
                                                <span className="font-semibold text-gray-900 truncate">
                                                    {group.headline ||
                                                        (group.is_paid
                                                            ? `Orders Paid — ${group.order_count} Order${group.order_count !== 1 ? "s" : ""}`
                                                            : `Unpaid Orders — ${group.order_count} Order${group.order_count !== 1 ? "s" : ""}`)}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide",
                                                        statusBadgeClass(group.is_paid)
                                                    )}
                                                >
                                                    {group.is_paid ? "Paid" : "Unpaid"}
                                                </span>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {formatCurrency(groupTotal)}
                                                </div>
                                                <div className="text-xs text-green-600 font-medium">
                                                    {group.order_count} order
                                                    {group.order_count !== 1 ? "s" : ""}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Orders table */}
                                        {isExpanded && (
                                            <div className="border-t overflow-x-auto">
                                                <table className="w-full min-w-[900px]">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b">
                                                            {PAYMENTS_COLUMNS.map((col) => (
                                                                <th
                                                                    key={col.key as string}
                                                                    className={cn(
                                                                        "px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap",
                                                                        col.headerClassName
                                                                    )}
                                                                >
                                                                    {col.label}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.orders.map((order, orderIdx) => (
                                                            <tr
                                                                key={`${order.order}-${orderIdx}`}
                                                                className="border-b last:border-0 bg-white hover:bg-gray-50/50"
                                                            >
                                                                <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                                                                    <span className="font-semibold text-red-600">
                                                                        {order.order}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                                    {order.advertiser ?? "—"}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                                    {order.audience ?? "—"}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                                    {order.channel ?? "—"}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                                    {formatMonth(order.booking_month)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">
                                                                    {formatNumber(order.qty_booked)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">
                                                                    {order.cpm != null
                                                                        ? `$${order.cpm.toFixed(2)}`
                                                                        : "—"}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-semibold text-gray-900">
                                                                    {formatCurrency(order.total)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {group.orders.length === 0 && (
                                                            <tr>
                                                                <td
                                                                    colSpan={PAYMENTS_COLUMNS.length}
                                                                    className="px-4 py-8 text-center text-sm text-gray-400"
                                                                >
                                                                    No orders in this group.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="bg-gray-50 border-t">
                                                            <td
                                                                colSpan={PAYMENTS_COLUMNS.length - 1}
                                                                className="px-4 py-3 text-right text-sm font-semibold text-gray-700"
                                                            >
                                                                Group Total:
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                                {formatCurrency(groupTotal)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {totalPages > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">Groups per page:</span>
                                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                                    <SelectTrigger className="w-20 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZE_OPTIONS.map((size) => (
                                            <SelectItem key={size} value={size.toString()}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(page - 1)}
                                    disabled={!hasPrev || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {renderPaginationButtons().map((item, idx) =>
                                    item === "ellipsis" ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-2 text-gray-400"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </span>
                                    ) : (
                                        <Button
                                            key={item}
                                            variant={item === page ? "default" : "outline"}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setPage(item)}
                                            disabled={isLoading}
                                        >
                                            {item}
                                        </Button>
                                    )
                                )}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(page + 1)}
                                    disabled={!hasNext || isLoading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
