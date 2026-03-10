"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "use-hook-api";
import {
  fetchCampaignBookedApi,
  viewGcpFileApi,
  downloadCampaignBookedFilesApi,
} from "@/api/admin";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SampleViewerDialog } from "@/components/admin/manualReviews/SampleViewerDialog";
import { Download, Eye, FileSpreadsheet, Loader2, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";

export interface CampaignBookedRecord {
  advertiser_name: string;
  ai_predicted_category_id: string;
  booked_date: string;
  booking_status: string;
  campaign_id: string;
  campaign_name: string;
  confirmed_category_id: string;
  view_gcp_file: string;
}

export default function CompleteBookingReviewPage() {
  const { categoryNames } = useCategories();
  const [getList, { data: listData, loading: listLoading }] = useApi({
    errMsg: true,
  });
  const [viewFile, { loading: viewingFile }] = useApi({});
  const [downloadFiles, { loading: downloading }] = useApi({ both: true, resSuccessMsg: "Downloaded files successfully" });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Clear row-level download state when request finishes (success or error)
  useEffect(() => {
    if (!downloading && downloadingId) setDownloadingId(null);
  }, [downloading, downloadingId]);

  const fetchList = useCallback(() => {
    getList(
      fetchCampaignBookedApi(
        statusFilter === "all"
          ? undefined
          : { status: statusFilter as "pending" | "reviewed" }
      )
    );
  }, [getList, statusFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const rawData = listData?.data ?? listData;
  const list: CampaignBookedRecord[] = Array.isArray(rawData) ? rawData : [];
  const count = typeof listData?.count === "number" ? listData.count : list.length;

  const handleViewInsertSample = async (gcpPath: string) => {
    if (!gcpPath) {
      toast.error("No insert sample available");
      return;
    }
    const res = (await viewFile(
      viewGcpFileApi({ view_gcp_file: gcpPath })
    ));
    const url = res?.data?.redirect_url;
    if (url) {
      setPreviewUrl(url);
    } else {
      toast.error(res?.message || "Failed to get file URL");
    }
  };

  const handleDownloadFiles = useCallback(
    (campaignId: string) => {
      setDownloadingId(campaignId);
      downloadFiles(downloadCampaignBookedFilesApi(campaignId), () => {
        setDownloadingId(null);
      });
    },
    [downloadFiles]
  );

  const detailsUrl = (campaignId: string) =>
    `/admin/complete-booking-review/${campaignId}`;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Complete Booking Review</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {listLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-gray-500">Loading booked campaigns...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No booked campaigns found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advertiser
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booked Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirmed Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Predicted Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Insert Sample
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {list.map((record) => {
                  const confirmedName =
                    record.confirmed_category_id &&
                    (categoryNames[record.confirmed_category_id] ??
                      record.confirmed_category_id);
                  const aiPredictedName =
                    record.ai_predicted_category_id &&
                    (categoryNames[record.ai_predicted_category_id] ??
                      record.ai_predicted_category_id);
                  const isDownloading = downloadingId === record.campaign_id;

                  return (
                    <tr key={record.campaign_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.advertiser_name ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.campaign_name ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.booked_date
                          ? formatDate(record.booked_date)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="capitalize">
                          {record.booking_status ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.confirmed_category_id
                          ? confirmedName
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.ai_predicted_category_id
                          ? aiPredictedName
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-3 text-xs"
                          onClick={() => handleViewInsertSample(record.view_gcp_file)}
                          disabled={!record.view_gcp_file || viewingFile}
                        >
                          {viewingFile ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              View
                            </>
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 shrink-0 p-0"
                              aria-label="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleDownloadFiles(record.campaign_id);
                              }}
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                              ) : (
                                <Download className="h-4 w-4 mr-2 shrink-0" />
                              )}
                              Download Art & Code Files
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={detailsUrl(record.campaign_id)} className="flex items-center cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4 mr-2 shrink-0" />
                                View Campaign Details Spreadsheet
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!listLoading && count > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Total: {count} booked campaign{count !== 1 ? "s" : ""}
        </p>
      )}

      <SampleViewerDialog
        open={!!previewUrl}
        url={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </main>
  );
}
