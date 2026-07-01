"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "use-hook-api";
import { ArrowLeft, ChevronDown, ChevronRight, CircleHelp } from "lucide-react";
import { getOrderSkidsApi } from "@/api/retailer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

type OrderType = "collated_envelope_parent" | "collated_envelope_child" | "normal_order";

interface SelectedOrder {
  id?: string;
  order_id?: string;
  order?: string;
  type?: OrderType | string;
  advertiser?: string | null;
  category?: string | null;
}

interface SkidRow {
  id?: string;
  skid_id: string;
  skid_name: string;
  total_qty: number | null;
  pacing_visualization: number | null;
  rfid_distributed: number | null;
  manual_distributed: number | null;
  status: string | null;
  distribution_center?: string | null;
}

interface DistributionCenterSkids {
  distribution_center: string;
  skids: SkidRow[];
  received_date?: string | null;
  status?: string | null;
}

interface GroupSummary {
  skidCount: number;
  totalQty: number;
  rfid: number;
  manual: number;
  pacingPercent: number;
  pacedQty: number;
  status: string;
}

const ORDER_CONTEXT_KEY = "retailer:selected-order";
const SKID_CONTEXT_KEY = "retailer:selected-skid";

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatReceivedDate(value: string | null | undefined): string {
  if (!value) return "Not yet received";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `Received ${value}`;
  return `Received ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getPacingPercent(value: number | null | undefined): number {
  return Math.min(Math.max(value ?? 0, 0), 100);
}

function getStatusClass(status: string | null | undefined): string {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized === "complete" || normalized === "completed") return "bg-green-100 text-green-700";
  if (normalized.includes("progress")) return "bg-blue-100 text-blue-700";
  if (normalized.includes("hold") || normalized.includes("pending")) return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
}

function getProgressColor(status: string | null | undefined): string {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized === "complete" || normalized === "completed") return "bg-green-500";
  if (normalized.includes("progress")) return "bg-blue-500";
  return "bg-gray-500";
}

function loadSelectedOrder(): SelectedOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(ORDER_CONTEXT_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function buildOrderTitle(order: SelectedOrder | null, orderId: string): string {
  if (!order) return orderId;
  const displayId = order.order ?? order.order_id ?? order.id ?? orderId;
  const descriptor = order.category ?? order.advertiser;
  const isEnvelope = order.type === "collated_envelope_parent" || order.type === "collated_envelope_child";
  const suffix = isEnvelope ? "Collated Envelope" : descriptor;
  return suffix ? `${displayId} — ${suffix}` : displayId;
}

function normalizeSkidGroups(data: any): DistributionCenterSkids[] {
  const payload = data?.data ?? data;
  const groups =
    payload?.distribution_centers ??
    payload?.distribution_center_skids ??
    payload?.dc_pacing_details ??
    payload?.skid_groups;

  if (Array.isArray(groups)) {
    return groups.map((group: any) => ({
      distribution_center:
        group.distribution_center ??
        group.distribution_center_name ??
        group.name ??
        "Distribution Center",
      skids: group.skids ?? group.records ?? [],
      received_date: group.received_date ?? group.received_on ?? group.received_at ?? null,
      status: group.status ?? null,
    }));
  }

  const flatSkids: SkidRow[] = payload?.skids ?? payload?.records ?? [];
  if (!Array.isArray(flatSkids)) return [];

  const grouped = flatSkids.reduce<Record<string, SkidRow[]>>((acc, skid) => {
    const distributionCenter = skid.distribution_center ?? "Distribution Center";
    if (!acc[distributionCenter]) acc[distributionCenter] = [];
    acc[distributionCenter].push(skid);
    return acc;
  }, {});

  return Object.entries(grouped).map(([distributionCenter, skids]) => ({
    distribution_center: distributionCenter,
    skids,
  }));
}

function getGroupSummary(group: DistributionCenterSkids): GroupSummary {
  const skidCount = group.skids.length;
  const totalQty = group.skids.reduce((sum, skid) => sum + (skid.total_qty ?? 0), 0);
  const rfid = group.skids.reduce((sum, skid) => sum + (skid.rfid_distributed ?? 0), 0);
  const manual = group.skids.reduce((sum, skid) => sum + (skid.manual_distributed ?? 0), 0);
  const averagePacing = skidCount
    ? group.skids.reduce((sum, skid) => sum + getPacingPercent(skid.pacing_visualization), 0) / skidCount
    : 0;
  const statuses = group.skids.map((skid) => skid.status?.toLowerCase() ?? "");
  const status =
    group.status ??
    (statuses.length > 0 && statuses.every((statusValue) => statusValue === "complete" || statusValue === "completed")
      ? "Complete"
      : statuses.some((statusValue) => statusValue.includes("progress"))
        ? "In Progress"
        : "Not Started");

  return {
    skidCount,
    totalQty,
    rfid,
    manual,
    pacingPercent: Math.round(averagePacing),
    pacedQty: Math.round((totalQty * averagePacing) / 100),
    status,
  };
}

function SummaryCard({
  label,
  value,
  showHelp = false,
}: {
  label: string;
  value: string;
  showHelp?: boolean;
}) {
  return (
    <div className="rounded-lg border border-l-4 border-gray-200 border-l-red-600 bg-white px-5 py-4 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {label}
        {showHelp && <CircleHelp className="h-3.5 w-3.5 text-gray-300" />}
      </div>
      <div className="text-2xl font-bold leading-none text-gray-900">{value}</div>
    </div>
  );
}

export function SkidTablePage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = decodeURIComponent(params.orderId);

  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
  const [groups, setGroups] = useState<DistributionCenterSkids[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [callSkids, { loading }] = useApi({ errMsg: true });

  useEffect(() => {
    setSelectedOrder(loadSelectedOrder());
    callSkids(getOrderSkidsApi(orderId), (response: any) => {
      const nextGroups = normalizeSkidGroups(response);
      setGroups(nextGroups);
      setExpandedGroups(new Set(nextGroups[0]?.distribution_center ? [nextGroups[0].distribution_center] : []));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const title = useMemo(() => buildOrderTitle(selectedOrder, orderId), [selectedOrder, orderId]);
  const pageSummary = useMemo(
    () =>
      groups.reduce(
        (summary, group) => {
          const groupSummary = getGroupSummary(group);
          return {
            totalSkids: summary.totalSkids + groupSummary.skidCount,
            totalQty: summary.totalQty + groupSummary.totalQty,
            rfid: summary.rfid + groupSummary.rfid,
            manual: summary.manual + groupSummary.manual,
          };
        },
        { totalSkids: 0, totalQty: 0, rfid: 0, manual: 0 },
      ),
    [groups],
  );

  const toggleGroup = (distributionCenter: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(distributionCenter)) next.delete(distributionCenter);
      else next.add(distributionCenter);
      return next;
    });
  };

  const handleLogClick = (group: DistributionCenterSkids, skid: SkidRow) => {
    const skidRecordId = skid.id ?? skid.skid_id;
    window.sessionStorage.setItem(
      SKID_CONTEXT_KEY,
      JSON.stringify({
        ...skid,
        distribution_center: group.distribution_center,
        order_id: orderId,
      }),
    );
    router.push(
      `/retailer/order-management/orders/${encodeURIComponent(orderId)}/skids/${encodeURIComponent(skidRecordId)}/history`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/retailer/order-management")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Order Management
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-0.5 text-sm font-medium text-gray-500">
            Distribution center pacing by skid - click a DC to expand
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner className="h-6 w-6" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            No skid records found for this order.
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-3 md:grid-cols-4">
              <SummaryCard label="Total Skids" value={formatNumber(pageSummary.totalSkids)} />
              <SummaryCard label="Total Quantity" value={formatNumber(pageSummary.totalQty)} />
              <SummaryCard label="RFID" value={formatNumber(pageSummary.rfid)} showHelp />
              <SummaryCard label="Manual" value={formatNumber(pageSummary.manual)} showHelp />
            </div>

            <div className="space-y-3">
              {groups.map((group) => (
                <section key={group.distribution_center} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  {(() => {
                    const groupSummary = getGroupSummary(group);
                    const isExpanded = expandedGroups.has(group.distribution_center);
                    return (
                      <>
                        <button
                          onClick={() => toggleGroup(group.distribution_center)}
                          className="flex w-full items-center justify-between gap-4 border-l-4 border-l-red-600 bg-white px-5 py-4 text-left text-gray-900 hover:bg-gray-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-base font-bold">DC - {group.distribution_center}</span>
                                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", getStatusClass(groupSummary.status))}>
                                  {groupSummary.status}
                                </span>
                              </div>
                              <div className="mt-0.5 text-sm font-medium text-gray-500">
                                {groupSummary.skidCount} {groupSummary.skidCount === 1 ? "skid" : "skids"} - {formatReceivedDate(group.received_date)}
                              </div>
                            </div>
                          </div>

                          <div className="hidden shrink-0 items-center gap-3 text-sm font-semibold md:flex">
                            <span>
                              {formatNumber(groupSummary.pacedQty)}
                              <span className="text-gray-400"> / {formatNumber(groupSummary.totalQty)}</span>
                            </span>
                            <span className="h-1.5 w-24 rounded-full bg-gray-200">
                              <span
                                className={cn("block h-1.5 rounded-full", getProgressColor(groupSummary.status))}
                                style={{ width: `${groupSummary.pacingPercent}%` }}
                              />
                            </span>
                            <span className="w-9 text-right text-gray-500">{groupSummary.pacingPercent}%</span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                              <thead>
                                <tr className="border-b bg-gray-100">
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Skid Name</th>
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Qty</th>
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Pacing</th>
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">RFID</th>
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Manual</th>
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">History</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.skids.map((skid) => {
                                  const pacing = getPacingPercent(skid.pacing_visualization);
                                  return (
                                    <tr key={skid.id ?? skid.id} className="border-b last:border-0 hover:bg-gray-50">
                                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{skid.skid_name}</td>
                                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700">{formatNumber(skid.total_qty)}</td>
                                      <td className="px-4 py-3">
                                        <div className="h-1.5 w-full max-w-sm rounded-full bg-gray-200">
                                          <div
                                            className={cn("h-1.5 rounded-full", getProgressColor(skid.status))}
                                            style={{ width: `${pacing}%` }}
                                          />
                                        </div>
                                      </td>
                                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700">{formatNumber(skid.rfid_distributed)}</td>
                                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700">{formatNumber(skid.manual_distributed)}</td>
                                      <td className="px-4 py-3 text-sm">
                                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", getStatusClass(skid.status))}>
                                          {skid.status ?? "-"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        <button
                                          onClick={() => handleLogClick(group, skid)}
                                          className="font-bold text-red-600 hover:text-red-700 hover:underline"
                                        >
                                          Log
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
