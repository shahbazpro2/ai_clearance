"use client";

import { useState, useMemo } from "react";
import { type BrandSubmission } from "@/api/mediaBuyer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Search,
  MessageSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BrandListTableProps {
  brands: BrandSubmission[];
  loading: boolean;
  onEditBrand: (brand: BrandSubmission) => void;
  onDeleteBrand?: (brand: BrandSubmission) => void;
}

export function BrandListTable({
  brands,
  loading,
  onEditBrand,
}: BrandListTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch = brand.domain
        .toLowerCase()
        .includes(searchTerm.toLowerCase().trim());
      const matchesStatus =
        statusFilter === "all" ||
        brand.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [brands, searchTerm, statusFilter]);

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("ready")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Ready for Campaign Creation
        </span>
      );
    }
    if (s.includes("pending")) {
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 cursor-default">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Pending
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
              The brand has been submitted and is waiting for Admin review.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (s.includes("rejected")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
          <XCircle className="h-3.5 w-3.5 text-red-600" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">Submitted Brands</h3>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {brands.length}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search domain..."
              className="pl-8 h-8 text-xs bg-white border-gray-300"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 sm:w-44 h-8 text-xs bg-white border-gray-300">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Ready for Campaign Creation">Ready</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Website / Domain</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Admin Message</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    Loading brand submissions...
                  </div>
                </td>
              </tr>
            )}

            {!loading && brands.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-1 max-w-sm mx-auto">
                    <p className="font-medium text-gray-700">No brand websites submitted yet</p>
                    <p className="text-xs text-gray-400">
                      Submit brand websites above to check availability and clearance.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && brands.length > 0 && filteredBrands.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                  No submitted brands match the selected filter.
                </td>
              </tr>
            )}

            {!loading &&
              filteredBrands.map((brand) => {
                const isPending = brand.status.toLowerCase() === "pending";

                return (
                  <tr
                    key={brand.brand_submission_id}
                    className="border-t hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Website / Domain */}
                    <td className="px-4 py-3 align-middle font-mono font-medium text-gray-900 text-xs">
                      {brand.domain}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 align-middle">
                      {renderStatusBadge(brand.status)}
                    </td>

                    {/* Admin Message */}
                    <td className="px-4 py-3 align-middle text-xs text-gray-600 max-w-xs">
                      {brand.admin_message ? (
                        <div className="inline-flex items-start gap-1.5 text-gray-700 bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                          <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{brand.admin_message}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Edit Action - Only for Pending */}
                        {isPending ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditBrand(brand)}
                            className="h-8 px-2.5 text-xs font-medium text-gray-700 hover:text-primary hover:bg-gray-50 border-gray-300"
                            title="Edit pending brand submission"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            Edit
                          </Button>
                        ) : (
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    className="h-8 px-2.5 text-xs font-medium opacity-40 cursor-not-allowed"
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Only pending submissions can be edited
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
