"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import {
  fetchCampaignProgramsApi,
  saveCampaignProgramsSelectionApi,
  type CampaignProgram,
  type CampaignRecord,
} from "@/api/mediaBuyer";
import { CampaignStepper } from "@/components/media-buyer/campaigns/CampaignStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { extractErrorMessage } from "@/lib/apiError";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignProgramSelectionStep2Props {
  campaign: CampaignRecord;
  onBack: () => void;
  onSaveDraftAndExit: () => void;
  onProceedToStep3: (selectedProgramIds: string[]) => void;
}

const CATEGORIES = [
  "ALL",
  "Food & Grocery",
  "Health & Wellness",
  "Beauty & Cosmetics",
  "Apparel & Fashion",
  "Home & Kitchen",
  "Pet Supplies",
  "Technology & Electronics",
  "Sports & Outdoors",
];

type SortableField =
  | "audience_name"
  | "program_type"
  | "attribution_distinction"
  | "media_cpm"
  | "category"
  | "website"
  | "annual_reach"
  | "female"
  | "male"
  | "avg_order_value";

export function CampaignProgramSelectionStep2({
  campaign,
  onBack,
  onSaveDraftAndExit,
  onProceedToStep3,
}: CampaignProgramSelectionStep2Props) {
  // Programs State
  const [programs, setPrograms] = useState<CampaignProgram[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>(
    campaign.selected_programs || []
  );

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("ALL");
  const [instantOnly, setInstantOnly] = useState(false);
  const [attributionEnabled, setAttributionEnabled] = useState(false);

  // Sorting State
  const [sortBy, setSortBy] = useState<SortableField | "">("audience_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // API Call
  const [callGetPrograms, { loading }] = useApi({
    both: false,
    errMsg: false,
  });

  const [callSaveSelection, { loading: isSaving }] = useApi({
    both: false,
    errMsg: false,
  });

  const callGetProgramsRef = useRef(callGetPrograms);
  callGetProgramsRef.current = callGetPrograms;

  const handleSaveAndExit = () => {
    callSaveSelection(
      saveCampaignProgramsSelectionApi(campaign.id, {
        channel_ids: selectedProgramIds,
      }),
      () => {
        onSaveDraftAndExit();
      },
      () => {
        onSaveDraftAndExit();
      }
    );
  };

  const handleProceed = () => {
    callSaveSelection(
      saveCampaignProgramsSelectionApi(campaign.id, {
        channel_ids: selectedProgramIds,
      }),
      () => {
        onProceedToStep3(selectedProgramIds);
      },
      () => {
        onProceedToStep3(selectedProgramIds);
      }
    );
  };

  const loadPrograms = () => {
    callGetProgramsRef.current(
      fetchCampaignProgramsApi({
        campaign_id: campaign.id,
        page,
        per_page: perPage,
        search: searchTerm.trim() || undefined,
        category: category !== "ALL" ? category : undefined,
        instant_only: instantOnly || undefined,
        attribution_enabled: attributionEnabled || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder,
      }),
      (res: any) => {
        const list: CampaignProgram[] = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setPrograms(list);
        }
        if (res?.pagination?.total != null) {
          setTotal(res.pagination.total);
        } else {
          setTotal(list.length);
        }
      },
      (err: any) => {
        const msg = extractErrorMessage(err, "Failed to load campaign programs.");
        console.warn(msg);
      }
    );
  };

  useEffect(() => {
    loadPrograms();
  }, [campaign.id, page, perPage, category, instantOnly, attributionEnabled, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadPrograms();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Column sorting handler
  const handleSort = (field: SortableField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Checkbox handlers
  const isAllCurrentPageSelected = useMemo(() => {
    if (programs.length === 0) return false;
    return programs.every((p) =>
      selectedProgramIds.includes(p.channel_id || p.id)
    );
  }, [programs, selectedProgramIds]);

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = new Set(selectedProgramIds);
      programs.forEach((p) => {
        const id = p.channel_id || p.id;
        if (id) newIds.add(id);
      });
      setSelectedProgramIds(Array.from(newIds));
    } else {
      const pageIds = new Set(programs.map((p) => p.channel_id || p.id));
      setSelectedProgramIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleProgram = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProgramIds((prev) => [...prev, id]);
    } else {
      setSelectedProgramIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCategory("ALL");
    setInstantOnly(false);
    setAttributionEnabled(false);
    setSortBy("audience_name");
    setSortOrder("asc");
    setPage(1);
  };

  const renderSortIcon = (field: SortableField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-60" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  const startRecord = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endRecord = Math.min(page * perPage, total);
  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* 4-Step Stepper */}
      <CampaignStepper currentStep={2} onStepClick={(s) => s === 1 && onBack()} />

      {/* Campaign State Banner */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Active Campaign
            </p>
            <h3 className="text-base font-bold text-gray-900">
              {campaign.name}
            </h3>
          </div>
          <div className="h-8 w-px bg-gray-200 hidden sm:block" />
          <div className="hidden sm:block">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Selected Brand
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-gray-800">
                {campaign.brand_name || campaign.brand_domain || "Brand"}
              </span>
            </div>
          </div>
        </div>

        {/* Selection Counter Badge */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium">Selected Programs:</span>
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-xs">
            {selectedProgramIds.length} Selected
          </span>
        </div>
      </div>

      {/* Program Selection Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Filters and Search Toolbar */}
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Box (Audience Name or Website) */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by audience name or website..."
                className="pl-9 h-9 text-xs sm:text-sm bg-white"
              />
            </div>

            {/* Filter 1: Category Dropdown */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="category-filter"
                className="text-xs font-semibold text-gray-600 shrink-0"
              >
                Category:
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="h-9 px-3 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkbox Filters */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-200/60 text-xs">
            <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
              Filter Options:
            </span>

            {/* Filter 2: Instant Programs Only */}
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 hover:text-gray-900 select-none">
              <input
                type="checkbox"
                checked={instantOnly}
                onChange={(e) => {
                  setInstantOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
              />
              <span>Instant Programs Only</span>
              <span className="text-[10px] text-gray-400">(Pre-approved brand)</span>
            </label>

            {/* Filter 3: Attribution Enabled Programs Only */}
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 hover:text-gray-900 select-none">
              <input
                type="checkbox"
                checked={attributionEnabled}
                onChange={(e) => {
                  setAttributionEnabled(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
              />
              <span>Attribution Enabled Programs Only</span>
              <span className="text-[10px] text-gray-400">(Shipment log feed active)</span>
            </label>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-primary hover:opacity-80 text-xs font-semibold underline ml-auto flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* 10-Column Programs Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-gray-600 min-w-[1100px]">
            <thead className="bg-gray-100/70 text-[11px] uppercase font-semibold text-gray-600 border-b border-gray-200 select-none">
              <tr>
                {/* Checkbox Column */}
                <th className="px-4 py-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                    title="Select / Deselect all on this page"
                  />
                </th>

                {/* 1. Audience Name */}
                <th
                  onClick={() => handleSort("audience_name")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Audience Name</span>
                    {renderSortIcon("audience_name")}
                  </div>
                </th>

                {/* 2. Program Type */}
                <th
                  onClick={() => handleSort("program_type")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Program Type</span>
                    {renderSortIcon("program_type")}
                  </div>
                </th>

                {/* 3. Attribution Distinction */}
                <th
                  onClick={() => handleSort("attribution_distinction")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Attribution Distinction</span>
                    {renderSortIcon("attribution_distinction")}
                  </div>
                </th>

                {/* 4. Media CPM */}
                <th
                  onClick={() => handleSort("media_cpm")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Media CPM</span>
                    {renderSortIcon("media_cpm")}
                  </div>
                </th>

                {/* 5. Category */}
                <th
                  onClick={() => handleSort("category")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {renderSortIcon("category")}
                  </div>
                </th>

                {/* 6. Website */}
                <th
                  onClick={() => handleSort("website")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Website</span>
                    {renderSortIcon("website")}
                  </div>
                </th>

                {/* 7. Annual Reach */}
                <th
                  onClick={() => handleSort("annual_reach")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Annual Reach</span>
                    {renderSortIcon("annual_reach")}
                  </div>
                </th>

                {/* 8. Female % */}
                <th
                  onClick={() => handleSort("female")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Female %</span>
                    {renderSortIcon("female")}
                  </div>
                </th>

                {/* 9. Male % */}
                <th
                  onClick={() => handleSort("male")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Male %</span>
                    {renderSortIcon("male")}
                  </div>
                </th>

                {/* 10. Avg Order Value */}
                <th
                  onClick={() => handleSort("avg_order_value")}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Avg Order Value</span>
                    {renderSortIcon("avg_order_value")}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && programs.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner size="lg" />
                      <span>Loading available programs...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && programs.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Layers className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-700">No programs found</p>
                      <p className="text-xs text-gray-400">
                        Try modifying your search or clearing active filters.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-xs mt-1"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {programs.map((p) => {
                const programId = p.channel_id || p.id;
                const isChecked = selectedProgramIds.includes(programId);
                const isInstant =
                  p.program_type?.toLowerCase() === "instant";
                const isAttribution =
                  p.attribution_distinction?.toLowerCase().includes("attribution");

                const cpmFormatted =
                  typeof p.media_cpm === "number"
                    ? `$${p.media_cpm.toFixed(2)}`
                    : p.media_cpm || "—";

                const aovFormatted =
                  typeof p.avg_order_value === "number"
                    ? `$${p.avg_order_value.toFixed(2)}`
                    : p.avg_order_value || "—";

                const reachFormatted =
                  typeof p.annual_reach === "number"
                    ? p.annual_reach.toLocaleString()
                    : p.annual_reach || "—";

                const femaleFormatted =
                  p.female_percentage != null
                    ? `${p.female_percentage}%`
                    : p.female != null
                    ? `${p.female}%`
                    : "—";

                const maleFormatted =
                  p.male_percentage != null
                    ? `${p.male_percentage}%`
                    : p.male != null
                    ? `${p.male}%`
                    : "—";

                const cleanWebsite = (p.website || "").replace(/^https?:\/\//, "");

                return (
                  <tr
                    key={programId}
                    className={cn(
                      "hover:bg-gray-50/80 transition-colors",
                      isChecked && "bg-primary/5"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleToggleProgram(programId, e.target.checked)
                        }
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                      />
                    </td>

                    {/* 1. Audience Name */}
                    <td className="px-4 py-3 align-middle font-semibold text-gray-900 whitespace-nowrap">
                      {p.audience_name}
                      {p.channel_name && (
                        <div className="text-[10px] font-normal text-gray-400">
                          {p.channel_name}
                        </div>
                      )}
                    </td>

                    {/* 2. Program Type */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      {isInstant ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Instant
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          Manual
                        </span>
                      )}
                    </td>

                    {/* 3. Attribution Distinction */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      {isAttribution ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          {p.attribution_distinction}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">
                          {p.attribution_distinction || "Standard"}
                        </span>
                      )}
                    </td>

                    {/* 4. Media CPM */}
                    <td className="px-4 py-3 align-middle text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                      {cpmFormatted}
                    </td>

                    {/* 5. Category */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium border border-gray-200">
                        {p.category || "General"}
                      </span>
                    </td>

                    {/* 6. Website */}
                    <td className="px-4 py-3 align-middle whitespace-nowrap font-mono text-[11px]">
                      {p.website ? (
                        <a
                          href={
                            p.website.startsWith("http")
                              ? p.website
                              : `https://${p.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>{cleanWebsite}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* 7. Annual Reach */}
                    <td className="px-4 py-3 align-middle text-right font-mono text-gray-700 whitespace-nowrap">
                      {reachFormatted}
                    </td>

                    {/* 8. Female % */}
                    <td className="px-4 py-3 align-middle text-right font-mono text-gray-700 whitespace-nowrap">
                      {femaleFormatted}
                    </td>

                    {/* 9. Male % */}
                    <td className="px-4 py-3 align-middle text-right font-mono text-gray-700 whitespace-nowrap">
                      {maleFormatted}
                    </td>

                    {/* 10. Avg Order Value */}
                    <td className="px-4 py-3 align-middle text-right font-mono font-medium text-gray-900 whitespace-nowrap">
                      {aovFormatted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
            <span className="ml-2 font-medium text-gray-700">
              Showing {startRecord} - {endRecord} of {total} programs
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="h-8 text-xs px-3"
            >
              Previous
            </Button>
            <span className="px-3 py-1 rounded font-bold bg-primary/10 text-primary">
              {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="h-8 text-xs px-3"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Step 2 Navigation Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-10 px-5 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 1</span>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={handleSaveAndExit}
            className="h-10 px-5 border-primary/30 text-primary hover:bg-primary/5 text-sm font-semibold"
          >
            {isSaving ? "Saving..." : "Save Draft & Exit"}
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            onClick={handleProceed}
            className="h-10 px-6 bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm text-sm font-semibold flex items-center gap-2"
          >
            <span>Proceed to Step 3</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
