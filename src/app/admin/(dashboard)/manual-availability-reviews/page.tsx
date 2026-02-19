"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "use-hook-api";
import { fetchManualAvailabilityRequestsApi } from "@/api/admin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2 } from "lucide-react";
import PaginationControls from "@/components/PaginationControls";

const PER_PAGE = 25;

export interface ManualAvailabilityRequestRecord {
  campaign_id: string;
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
  const [page, setPage] = useState(1);
  const [programsModalRecord, setProgramsModalRecord] = useState<ManualAvailabilityRequestRecord | null>(null);

  const [getList, { data: listData, loading: listLoading }] = useApi({ errMsg: true });

  const fetchList = useCallback(() => {
    getList(
      fetchManualAvailabilityRequestsApi({
        status: statusFilter,
        page,
        per_page: PER_PAGE,
      })
    );
  }, [statusFilter, page, getList]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const rawList = listData?.data ?? listData?.results ?? listData ?? [];
  const list: ManualAvailabilityRequestRecord[] = Array.isArray(rawList) ? rawList : [];
  const total =
    typeof listData?.total === "number"
      ? listData.total
      : typeof listData?.total_count === "number"
        ? listData.total_count
        : list.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const pagination = {
    page,
    total,
    pages: totalPages,
    limit: PER_PAGE,
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Manual Availability Review</h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as "pending" | "reviewed");
            setPage(1);
          }}
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
                          {record.status ? (
                            <span className="capitalize">{record.status}</span>
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
            {totalPages > 1 && (
              <div className="border-t px-4 py-3">
                <PaginationControls
                  pagination={pagination}
                  isLoading={listLoading}
                  onPageChange={setPage}
                />
              </div>
            )}
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
