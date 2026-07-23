"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApi } from "use-hook-api";
import { fetchManualAvailabilityRequestsApi } from "@/api/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagination } from "@/hooks/usePagination";
import { buildPaginationMeta, DEFAULT_PER_PAGE } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";
import { Eye, Loader2 } from "lucide-react";

export interface ManualAvailabilityRequestRecord {
  campaign_id: string;
  campaign_name?: string;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  name?: string;
  advertiser_name?: string;
  programs_count?: number;
  programs?: Array<{ program_name?: string; program_id?: string }>;
  status?: string;
}

function getAdvertiserName(record: ManualAvailabilityRequestRecord): string {
  return record.user_name ?? record.advertiser_name ?? record.name ?? "—";
}

function getCampaignName(record: ManualAvailabilityRequestRecord): string {
  return record.campaign_name ?? record.campaign_id ?? "—";
}

function getProgramsCount(record: ManualAvailabilityRequestRecord): number {
  if (typeof record.programs_count === "number") return record.programs_count;
  if (Array.isArray(record.programs)) return record.programs.length;
  return 0;
}

function getProgramsList(record: ManualAvailabilityRequestRecord): Array<{ program_name: string }> {
  if (!Array.isArray(record.programs)) return [];
  return record.programs.map((p) => ({
    program_name: p.program_name ?? p.program_id ?? "—",
  }));
}

export default function ManualAvailabilityReviewPage() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "reviewed">("pending");
  const [programsModalRecord, setProgramsModalRecord] = useState<ManualAvailabilityRequestRecord | null>(null);

  const [getList, { data: listData, fullRes: fullRes, loading: listLoading }] = useApi({ errMsg: true, fullRes: true });

  const totalFromRes =
    typeof fullRes?.total === "number"
      ? fullRes.total
      : typeof fullRes?.total_count === "number"
        ? fullRes.total_count
        : 0;

  const serverPage = fullRes?.pagination?.page ?? fullRes?.page ?? 1;
  const { page, paginationBarProps } = usePagination({
    pagination:
      fullRes?.pagination ??
      (totalFromRes >= 0
        ? buildPaginationMeta(serverPage, DEFAULT_PER_PAGE, totalFromRes)
        : null),
    loading: listLoading,
    resetPageWhen: statusFilter,
  });

  const getListRef = useRef(getList);
  getListRef.current = getList;
  useEffect(() => {
    getListRef.current(
      fetchManualAvailabilityRequestsApi({
        status: statusFilter,
        page,
        per_page: DEFAULT_PER_PAGE,
      })
    );
  }, [statusFilter, page]);

  const rawList = listData?.data ?? fullRes?.data ?? listData?.results ?? listData ?? [];
  const list: ManualAvailabilityRequestRecord[] = Array.isArray(rawList) ? rawList : [];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Manual Availability Review</h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "pending" | "reviewed")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {listLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-gray-500">Loading records...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {statusFilter} records found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Campaign Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Advertiser
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Programs Count
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Updated At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {list.map((record) => {
                    const campaignId = record.campaign_id ?? "";
                    const count = getProgramsCount(record);
                    const programsList = getProgramsList(record);

                    return (
                      <tr key={campaignId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCampaignName(record)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getAdvertiserName(record)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {programsList.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setProgramsModalRecord(record)}
                              className="text-primary hover:underline font-medium"
                            >
                              {count} Program{count !== 1 ? "s" : ""}
                            </button>
                          ) : (
                            <span className="text-gray-700">
                              {count} Program{count !== 1 ? "s" : ""}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.created_at ? formatDate(record.created_at) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.updated_at ? formatDate(record.updated_at) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.status ? (
                            <Badge
                              variant="outline"
                              style={
                                record.status.toLowerCase() === "pending"
                                  ? { backgroundColor: "#fef9c3", color: "#854d0e", borderColor: "#fde047" }
                                  : { backgroundColor: "#dbeafe", color: "#1e40af", borderColor: "#93c5fd" }
                              }
                            >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/admin/manual-availability-reviews/${campaignId}`}>
                            <Button variant="default" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationBar {...paginationBarProps} />
          </>
        )}
      </div>

      <Dialog open={!!programsModalRecord} onOpenChange={(open) => !open && setProgramsModalRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Programs {programsModalRecord ? `— ${getAdvertiserName(programsModalRecord)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {programsModalRecord && (
            <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 max-h-80 overflow-y-auto pr-2">
              {getProgramsList(programsModalRecord).map((p, i) => (
                <li key={i}>{p.program_name}</li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
