"use client";

import { useMemo } from "react";
import type { CampaignRecord } from "@/api/mediaBuyer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Layers,
  BarChart3,
  Eye,
} from "lucide-react";

interface CampaignsDashboardTableProps {
  campaigns: CampaignRecord[];
  loading: boolean;
  onCreateCampaign: () => void;
  onContinueCampaign: (campaign: CampaignRecord) => void;
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages?: number;
  } | null;
  onPageChange?: (page: number) => void;
}

export function CampaignsDashboardTable({
  campaigns,
  loading,
  onCreateCampaign,
  onContinueCampaign,
  pagination,
  onPageChange,
}: CampaignsDashboardTableProps) {
  const stats = useMemo(() => {
    let drafts = 0;
    let completed = 0;
    campaigns.forEach((c) => {
      const isDraft =
        !c.status ||
        c.status.toLowerCase() === "draft" ||
        c.status.toLowerCase() === "in-progress";
      if (isDraft) {
        drafts++;
      } else {
        completed++;
      }
    });
    return {
      total: pagination?.total ?? campaigns.length,
      drafts,
      completed,
    };
  }, [campaigns, pagination]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recently";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Campaigns
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your marketing campaigns, estimates, and resume in-progress drafts.
          </p>
        </div>
        <div>
          <Button
            onClick={onCreateCampaign}
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm text-xs sm:text-sm font-semibold h-10 px-5 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Campaigns
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Drafts (In-Progress)
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.drafts}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Completed / Ready
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats.completed}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Campaigns Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">Your Campaigns</h3>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {stats.total}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Draft campaigns can be continued anytime with the{" "}
            <span className="font-semibold text-primary">Continue</span> action.
          </p>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-600 min-w-[760px]">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 select-none">
              <tr>
                <th className="px-6 py-3.5 whitespace-nowrap">Campaign Name</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Brand</th>
                <th className="px-6 py-3.5 text-center whitespace-nowrap">Programs Selected</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-6 py-3.5 whitespace-nowrap">Created Date</th>
                <th className="px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner size="lg" />
                      <span>Loading campaigns...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <Layers className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-gray-700">No campaigns created yet</p>
                      <p className="text-xs text-gray-400">
                        Click &ldquo;Create Campaign&rdquo; above to set up your first campaign draft.
                      </p>
                      <Button
                        onClick={onCreateCampaign}
                        size="sm"
                        className="mt-2 bg-blue-gradient text-white hover:bg-blue-gradient/90 text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Create Campaign
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {campaigns.map((c) => {
                const isDraft =
                  !c.status ||
                  c.status.toLowerCase() === "draft" ||
                  c.status.toLowerCase() === "in-progress";

                const programsCount =
                  Array.isArray(c.selected_programs) ? c.selected_programs.length : 0;

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Campaign Name & ID */}
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <div className="font-bold text-gray-900">{c.name}</div>
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                        ID: {c.id}
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {c.brand_name || c.brand_domain || "Brand"}
                      </span>
                    </td>

                    {/* Programs Selected */}
                    <td className="px-6 py-4 align-middle text-center whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        {programsCount}
                      </span>
                      <span className="text-xs text-gray-400"> programs</span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      {isDraft ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Completed
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 align-middle text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 align-middle text-right whitespace-nowrap">
                      {isDraft ? (
                        <Button
                          size="sm"
                          onClick={() => onContinueCampaign(c)}
                          className="bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm text-xs font-bold h-8 px-3.5 rounded-lg inline-flex items-center gap-1"
                        >
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onContinueCampaign(c)}
                          className="h-8 px-3 text-xs font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-gray-500" />
                          View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.total > pagination.per_page && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing page <span className="font-bold text-gray-800">{pagination.page}</span> of{" "}
              <span className="font-bold text-gray-800">
                {pagination.total_pages || Math.ceil(pagination.total / pagination.per_page)}
              </span>{" "}
              ({pagination.total} campaigns)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange?.(pagination.page - 1)}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  pagination.page >=
                  (pagination.total_pages || Math.ceil(pagination.total / pagination.per_page))
                }
                onClick={() => onPageChange?.(pagination.page + 1)}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
