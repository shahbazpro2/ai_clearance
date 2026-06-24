"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "use-hook-api";
import { ArrowLeft } from "lucide-react";
import { getSkidUpdateLogsApi } from "@/api/retailer";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface SelectedSkid {
  id?: string;
  skid_id?: string;
  order_id?: string;
  distribution_center?: string | null;
}

interface SkidLog {
  id?: string;
  date: string;
  type: string;
  cartons_remaining: number | null;
}

const SKID_CONTEXT_KEY = "retailer:selected-skid";

function loadSelectedSkid(): SelectedSkid | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(SKID_CONTEXT_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function normalizeLogs(data: any): SkidLog[] {
  const payload = data?.data ?? data;
  const logs = payload?.logs ?? payload?.update_logs ?? payload?.records ?? payload;
  return Array.isArray(logs) ? logs : [];
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US").format(value);
}

export function PacingHistoryLogPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string; skidId: string }>();
  const orderId = decodeURIComponent(params.orderId);
  const skidId = decodeURIComponent(params.skidId);

  const [selectedSkid, setSelectedSkid] = useState<SelectedSkid | null>(null);
  const [logs, setLogs] = useState<SkidLog[]>([]);
  const [callLogs, { loading }] = useApi({ errMsg: true });

  useEffect(() => {
    setSelectedSkid(loadSelectedSkid());
    callLogs(getSkidUpdateLogsApi(skidId), (response: any) => {
      setLogs(normalizeLogs(response));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skidId]);

  const displayedSkidId = selectedSkid?.skid_id ?? skidId;
  const distributionCenter = selectedSkid?.distribution_center;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.push(`/retailer/order-management/orders/${encodeURIComponent(orderId)}/skids`)}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to DC Pacing
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{displayedSkidId} - Pacing History Log</h1>
        {distributionCenter && (
          <p className="text-sm text-gray-500 mt-0.5">{distributionCenter}</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-6 w-6" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No update logs found for this skid.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cartons Remaining</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.id ?? `${log.date}-${log.type}-${index}`} className="border-b last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{log.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{log.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatNumber(log.cartons_remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
