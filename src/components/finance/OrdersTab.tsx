"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useApi } from "use-hook-api";
import { retrieveOrdersApi, type OrderRecord, type OrdersPagination } from "@/api/finance";
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

interface OrdersTabProps {
    channelIds: string[];
}

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const ORDERS_COLUMNS: {
    key: keyof OrderRecord;
    label: string;
    sortable?: boolean;
    className?: string;
    headerClassName?: string;
}[] = [
    { key: "order_date", label: "Order Date", sortable: true },
    { key: "order", label: "Order", sortable: true },
    { key: "advertiser", label: "Advertiser", sortable: true },
    { key: "audience", label: "Audience", sortable: true },
    { key: "channel", label: "Channel", sortable: true },
    { key: "booking_month", label: "Booking Month", sortable: true },
    { key: "qty_booked", label: "Quantity Booked", className: "text-right", headerClassName: "text-right" },
    { key: "pacing", label: "Pacing" },
    { key: "qty_distributed_manual", label: "Qty Distributed (Manual)", className: "text-right", headerClassName: "text-right" },
    { key: "qty_distributed_rfid", label: "Qty Distributed (RFID)", className: "text-right", headerClassName: "text-right" },
    { key: "cpm", label: "CPM", className: "text-right", headerClassName: "text-right" },
    { key: "total", label: "Total", className: "text-right font-semibold", headerClassName: "text-right" },
    { key: "projected_payment_date", label: "Projected Payment Date" },
    { key: "payment_status", label: "Payment" },
    { key: "order_cancelled", label: "Cancelled", className: "text-center", headerClassName: "text-center" },
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

function formatDate(value: string | null | undefined): string {
    if (!value) return "—";
    try {
        const date = new Date(value);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    } catch {
        return value;
    }
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

function paymentBadgeClass(status: string | null | undefined): string {
    const s = (status ?? "").toLowerCase();
    if (s === "paid") return "bg-green-100 text-green-700 border border-green-200";
    if (s === "unpaid" || s === "pending") return "bg-red-100 text-red-700 border border-red-200";
    return "bg-gray-100 text-gray-500 border border-gray-200";
}

export function OrdersTab({ channelIds }: OrdersTabProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [sortBy, setSortBy] = useState<keyof OrderRecord>("order_date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [records, setRecords] = useState<OrderRecord[]>([]);
    const [pagination, setPagination] = useState<OrdersPagination | null>(null);

    const [callApi, { loading: isLoading }] = useApi({ both: false });

    const channelIdsKey = channelIds.join(",");

    const fetchOrders = () => {
        if (channelIds.length === 0) {
            setRecords([]);
            setPagination(null);
            return;
        }

        callApi(
            retrieveOrdersApi({
                channel_ids: channelIds,
                sort_by: sortBy,
                sort_order: sortOrder,
                page,
                page_size: pageSize,
            }),
            ({ data }: any) => {
                setRecords(data?.orders || []);
                setPagination(data?.pagination || null);
            }
        );
    };

    useEffect(() => {
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelIdsKey, pageSize]);

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelIdsKey, page, pageSize, sortBy, sortOrder]);

    const handleSort = (key: keyof OrderRecord) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(key);
            setSortOrder("desc");
        }
    };

    const handlePageSizeChange = (newSize: string) => {
        setPageSize(parseInt(newSize, 10));
    };

    const total = pagination?.total_orders || 0;
    const totalPages = pagination?.total_pages || 0;
    const hasNext = pagination?.has_next || false;
    const hasPrev = pagination?.has_previous || false;

    const startItem = total > 0 ? (page - 1) * pageSize + 1 : 0;
    const endItem = Math.min(page * pageSize, total);

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
            {isLoading && records.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <LoadingSpinner className="h-6 w-6" />
                </div>
            ) : channelIds.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">
                    Select an audience and channel to view orders.
                </div>
            ) : records.length === 0 && total === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">
                    No orders found for the selected filters.
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-500">
                            {total > 0
                                ? `Showing ${startItem}–${endItem} of ${formatNumber(total)} order${total !== 1 ? "s" : ""}`
                                : "Loading…"}
                        </div>
                    </div>

                    <div className="border rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1400px]">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        {ORDERS_COLUMNS.map((col) => (
                                            <th
                                                key={col.key as string}
                                                className={cn(
                                                    "px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap select-none",
                                                    col.headerClassName,
                                                    col.sortable &&
                                                        "cursor-pointer hover:bg-gray-100 transition-colors"
                                                )}
                                                onClick={() => col.sortable && handleSort(col.key)}
                                            >
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-1",
                                                        col.headerClassName?.includes("text-right") &&
                                                            "justify-end",
                                                        col.headerClassName?.includes("text-center") &&
                                                            "justify-center"
                                                    )}
                                                >
                                                    {col.label}
                                                    {col.sortable && (
                                                        <ArrowUpDown
                                                            className={cn(
                                                                "h-3 w-3",
                                                                sortBy === col.key
                                                                    ? "text-primary opacity-100"
                                                                    : "opacity-40"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record, idx) => {
                                        const pacing =
                                            typeof record.pacing === "number"
                                                ? Math.min(Math.max(record.pacing, 0), 100)
                                                : null;
                                        return (
                                            <tr
                                                key={`${record.order}-${idx}`}
                                                className="border-b last:border-0 bg-white hover:bg-gray-50/50"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                    {formatDate(record.order_date)}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                                                    <span className="font-semibold text-red-600">
                                                        {record.order}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                    {record.advertiser ?? "—"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                    {record.audience ?? "—"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                    {record.channel ?? "—"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                    {formatMonth(record.booking_month)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">
                                                    {formatNumber(record.qty_booked)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {pacing == null ? (
                                                        <span className="text-sm text-gray-500">—</span>
                                                    ) : (
                                                        <div className="w-28">
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                {Math.round(pacing)}%
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                                                                    style={{ width: `${pacing}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">
                                                    {formatNumber(record.qty_distributed_manual)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">
                                                    {formatNumber(record.qty_distributed_rfid)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap text-right">
                                                    {record.cpm != null
                                                        ? `$${record.cpm.toFixed(2)}`
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-semibold text-gray-900">
                                                    {formatCurrency(record.total)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                    {formatDate(record.projected_payment_date)}
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                    {record.payment_status ? (
                                                        <span
                                                            className={cn(
                                                                "text-xs font-medium px-2 py-0.5 rounded",
                                                                paymentBadgeClass(record.payment_status)
                                                            )}
                                                        >
                                                            {record.payment_status}
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap text-center">
                                                    {record.order_cancelled ? (
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                                                            Cancelled
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">Rows per page:</span>
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
