"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { useApi } from "use-hook-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { classificationResultAtom, selectedCategoryAtom, selectedCategoryLabelAtom } from "@/store/campaign";
import { fetchInsertProgramsApi } from "../../../../api/campaigns";

interface ProgramsSelectionStepProps {
  selectedCategoryType: "ai" | "self" | null;
  onComplete: () => void;
  onBackToUpload?: () => void;
}

interface InsertProgram {
  id?: string;
  program_id?: string;
  channel_id?: string;
  name?: string;
  program_name?: string;
  title?: string;
  channel_name?: string;
  retailer_name?: string;
  category?: string;
  category_name?: string;
  vertical?: string;
  website?: string;
  url?: string;
  link?: string;
  annual_circulation?: number;
  annualCirculation?: number;
  circulation?: number;
  age?: string | number;
  age_range?: string;
  audience_age?: string;
  income?: string | number;
  household_income?: string;
  average_income?: string;
  female_percentage?: number;
  female_percent?: number;
  female_pct?: number;
  male_percentage?: number;
  male_percent?: number;
  male_pct?: number;
  average_manual_check_response_time?: string | number;
  avg_manual_response_time?: string | number;
  manual_response_time?: string | number;
  response_time?: string | number;
  manual_response_time_hours?: number;
  response_time_hours?: number;
  average_order_value?: number | string;
  avg_order_value?: number | string;
  aov?: number | string;
  instant_availability?: boolean;
  instant?: boolean;
  instant_availability_check?: boolean | string;
  availability_check_type?: "instant" | "manual";
  check_type?: "instant" | "manual";
  [key: string]: any;
}

type SortKey = "name" | "annual_circulation" | "average_order_value" | "average_manual_check_response_time";
type ResponseTimeFilter = "all" | "fast" | "standard" | "slow";
type OrderValueFilter = "all" | "under50" | "50to100" | "over100";

const PAGE_SIZE = 10;

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const getFieldValue = (program: InsertProgram, keys: string[]): any => {
  for (const key of keys) {
    const value = program[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
};

const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isNaN(numeric) ? null : numeric;
  }

  return null;
};

const getProgramId = (program: InsertProgram): string => {
  return String(
    program.id ??
    program.program_id ??
    program.channel_id ??
    program.slug ??
    program.code ??
    program.uuid ??
    program.name ??
    program.website ??
    program.category ??
    JSON.stringify(program)
  );
};

const getProgramName = (program: InsertProgram): string => {
  return (
    (getFieldValue(program, [
      "name",
      "program_name",
      "title",
      "retailer_name",
      "channel_name",
    ]) as string | null) ?? "Untitled Program"
  );
};

const getProgramCategory = (program: InsertProgram): string | null => {
  return getFieldValue(program, ["category", "category_name", "vertical"]);
};

const getProgramWebsite = (program: InsertProgram): string | null => {
  return getFieldValue(program, ["website", "url", "link"]);
};

const getWebsiteHref = (website: string | null): string | null => {
  if (!website) return null;
  if (/^https?:\/\//i.test(website)) {
    return website;
  }
  return `https://${website}`;
};

const getAnnualCirculation = (program: InsertProgram): number | null => {
  return (
    parseNumericValue(
      getFieldValue(program, ["annual_circulation", "annualCirculation", "circulation"])
    ) ?? null
  );
};

const getAverageOrderValue = (program: InsertProgram): number | null => {
  return parseNumericValue(getFieldValue(program, ["average_order_value", "avg_order_value", "aov"]));
};

const getManualResponseTimeHours = (program: InsertProgram): number | null => {
  return (
    parseNumericValue(
      getFieldValue(program, [
        "average_manual_check_response_time",
        "avg_manual_response_time",
        "manual_response_time",
        "manual_response_time_hours",
        "response_time_hours",
      ])
    ) ?? null
  );
};

const interpretInstantFlag = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "instant") return true;
    if (normalized === "manual") return false;
  }
  return null;
};

const getAvailabilityType = (program: InsertProgram): "instant" | "manual" => {
  const instantChecks = [
    interpretInstantFlag(program.instant_availability),
    interpretInstantFlag(program.instant),
    interpretInstantFlag(program.instant_availability_check),
  ];

  if (instantChecks.includes(true) || program.check_type === "instant" || program.availability_check_type === "instant") {
    return "instant";
  }

  if (
    instantChecks.includes(false) ||
    program.check_type === "manual" ||
    program.availability_check_type === "manual"
  ) {
    return "manual";
  }

  return "manual";
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return `${value}%`;
};

const formatManualResponseTime = (program: InsertProgram): string => {
  const raw =
    getFieldValue(program, [
      "average_manual_check_response_time",
      "avg_manual_response_time",
      "manual_response_time",
      "response_time",
    ]) ?? null;

  if (raw) {
    return typeof raw === "number" ? `${raw} hrs` : String(raw);
  }

  const hours = getManualResponseTimeHours(program);
  if (hours !== null) {
    return `${hours} hrs`;
  }
  return "N/A";
};

const formatOrderValue = (program: InsertProgram): string => {
  const value = getAverageOrderValue(program);
  if (value === null) {
    return "N/A";
  }
  return currencyFormatter.format(value);
};

export function ProgramsSelectionStep({
  selectedCategoryType,
  onComplete,
  onBackToUpload,
}: ProgramsSelectionStepProps) {
  const selectedCategoryId = useAtomValue(selectedCategoryAtom);
  const selectedCategoryLabel = useAtomValue(selectedCategoryLabelAtom);
  const classificationResult = useAtomValue(classificationResultAtom);

  const [
    callFetchPrograms,
    { data: programsResponse, loading: loadingPrograms, error: programsError },
  ] = useApi({ errMsg: true });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [responseTimeFilter, setResponseTimeFilter] = useState<ResponseTimeFilter>("all");
  const [orderValueFilter, setOrderValueFilter] = useState<OrderValueFilter>("all");
  const [instantOnly, setInstantOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const effectiveCategoryId = useMemo(() => {
    if (selectedCategoryType === "ai") {
      return (
        classificationResult?.predicted_category_id ??
        classificationResult?.predicted_category ??
        null
      );
    }
    return (
      selectedCategoryId ??
      classificationResult?.predicted_category_id ??
      classificationResult?.predicted_category ??
      null
    );
  }, [
    classificationResult?.predicted_category,
    classificationResult?.predicted_category_id,
    selectedCategoryId,
    selectedCategoryType,
  ]);

  const effectiveCategoryLabel = useMemo(() => {
    if (selectedCategoryType === "ai") {
      return (
        classificationResult?.predicted_category_label ??
        classificationResult?.predicted_category ??
        null
      );
    }
    return (
      selectedCategoryLabel ??
      classificationResult?.predicted_category_label ??
      classificationResult?.predicted_category ??
      null
    );
  }, [
    classificationResult?.predicted_category,
    classificationResult?.predicted_category_label,
    selectedCategoryLabel,
    selectedCategoryType,
  ]);

  useEffect(() => {
    if (!effectiveCategoryId) return;
    callFetchPrograms(fetchInsertProgramsApi(effectiveCategoryId));
  }, [callFetchPrograms, effectiveCategoryId]);

  useEffect(() => {
    setSelectedPrograms([]);
    setCurrentPage(1);
  }, [effectiveCategoryId]);

  const programs: InsertProgram[] = useMemo(() => {
    const raw =
      (programsResponse as any)?.data ??
      (programsResponse as any)?.programs ??
      programsResponse ??
      [];
    return Array.isArray(raw) ? raw : [];
  }, [programsResponse]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    programs.forEach((program) => {
      const category = getProgramCategory(program);
      if (category) {
        categories.add(category);
      }
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return programs.filter((program) => {
      const name = getProgramName(program);
      const category = getProgramCategory(program);
      const website = getProgramWebsite(program);
      const availabilityType = getAvailabilityType(program);
      const orderValue = getAverageOrderValue(program);
      const manualResponseHours = getManualResponseTimeHours(program);

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        (category?.toLowerCase().includes(search) ?? false) ||
        (website?.toLowerCase().includes(search) ?? false);

      if (!matchesSearch) return false;

      if (categoryFilter !== "all" && category !== categoryFilter) {
        return false;
      }

      if (instantOnly && availabilityType !== "instant") {
        return false;
      }

      if (responseTimeFilter !== "all") {
        if (manualResponseHours === null) return false;
        if (responseTimeFilter === "fast" && manualResponseHours > 24) return false;
        if (
          responseTimeFilter === "standard" &&
          (manualResponseHours <= 24 || manualResponseHours > 72)
        ) {
          return false;
        }
        if (responseTimeFilter === "slow" && manualResponseHours <= 72) return false;
      }

      if (orderValueFilter !== "all") {
        if (orderValue === null) return false;
        if (orderValueFilter === "under50" && orderValue >= 50) return false;
        if (orderValueFilter === "50to100" && (orderValue < 50 || orderValue > 100)) return false;
        if (orderValueFilter === "over100" && orderValue <= 100) return false;
      }

      return true;
    });
  }, [categoryFilter, instantOnly, orderValueFilter, programs, responseTimeFilter, searchTerm]);

  const sortedPrograms = useMemo(() => {
    const sorted = [...filteredPrograms];
    sorted.sort((a, b) => {
      const valueA = (() => {
        switch (sortKey) {
          case "annual_circulation":
            return getAnnualCirculation(a);
          case "average_manual_check_response_time":
            return getManualResponseTimeHours(a);
          case "average_order_value":
            return getAverageOrderValue(a);
          case "name":
          default:
            return getProgramName(a).toLowerCase();
        }
      })();

      const valueB = (() => {
        switch (sortKey) {
          case "annual_circulation":
            return getAnnualCirculation(b);
          case "average_manual_check_response_time":
            return getManualResponseTimeHours(b);
          case "average_order_value":
            return getAverageOrderValue(b);
          case "name":
          default:
            return getProgramName(b).toLowerCase();
        }
      })();

      if (valueA === null && valueB === null) return 0;
      if (valueA === null) return sortDirection === "asc" ? 1 : -1;
      if (valueB === null) return sortDirection === "asc" ? -1 : 1;

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return sortDirection === "asc"
        ? Number(valueA) - Number(valueB)
        : Number(valueB) - Number(valueA);
    });

    return sorted;
  }, [filteredPrograms, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedPrograms.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedPrograms.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedPrograms]);

  const programMap = useMemo(() => {
    const map = new Map<string, InsertProgram>();
    programs.forEach((program) => {
      map.set(getProgramId(program), program);
    });
    return map;
  }, [programs]);

  const handleToggleProgram = (programId: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
    );
  };

  const allVisibleSelected =
    paginatedPrograms.length > 0 &&
    paginatedPrograms.every((program) => selectedPrograms.includes(getProgramId(program)));

  const someVisibleSelected =
    paginatedPrograms.some((program) => selectedPrograms.includes(getProgramId(program))) &&
    !allVisibleSelected;

  const handleToggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked) {
      setSelectedPrograms((prev) => {
        const next = new Set(prev);
        paginatedPrograms.forEach((program) => {
          next.add(getProgramId(program));
        });
        return Array.from(next);
      });
    } else {
      setSelectedPrograms((prev) =>
        prev.filter((id) => !paginatedPrograms.some((program) => getProgramId(program) === id))
      );
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setResponseTimeFilter("all");
    setOrderValueFilter("all");
    setInstantOnly(false);
    setSortKey("name");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  const handleSubmitSelection = async () => {
    if (selectedPrograms.length === 0) return;
    setSubmitting(true);
    try {
      // Placeholder for availability request submission when backend endpoint is ready
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const selectionStats = useMemo(() => {
    return selectedPrograms.reduce(
      (acc, programId) => {
        const program = programMap.get(programId);
        if (!program) return acc;
        if (getAvailabilityType(program) === "instant") {
          acc.instant += 1;
        } else {
          acc.manual += 1;
        }
        return acc;
      },
      { instant: 0, manual: 0 }
    );
  }, [programMap, selectedPrograms]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Programs Selection</h3>
            <p className="text-sm text-gray-600">
              Pick the programs you want to include in your availability request.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onBackToUpload && (
              <Button variant="outline" size="sm" onClick={onBackToUpload}>
                Return to Upload Step
              </Button>
            )}
            {selectedCategoryType && (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold">
                {selectedCategoryType === "ai" ? "AI-predicted category" : "Self-declared category"}
              </Badge>
            )}
          </div>
        </div>

        {effectiveCategoryId ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Showing programs that support{" "}
            <span className="font-semibold">
              {effectiveCategoryLabel ?? effectiveCategoryId}
            </span>
            . Use filters to narrow down
            the list or focus on instant availability.
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            Select a category before choosing programs. The list will refresh once a category is
            available.
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name or website"
          />
          <div className="w-full">
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
          <div className="w-full">
            <Select
              value={responseTimeFilter}
              onValueChange={(value) => {
                setResponseTimeFilter(value as ResponseTimeFilter);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Avg manual response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All response times</SelectItem>
                <SelectItem value="fast">Under 24 hrs</SelectItem>
                <SelectItem value="standard">24-72 hrs</SelectItem>
                <SelectItem value="slow">72+ hrs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <Select
              value={orderValueFilter}
              onValueChange={(value) => {
                setOrderValueFilter(value as OrderValueFilter);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Average order value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All AOV ranges</SelectItem>
                <SelectItem value="under50">Under $50</SelectItem>
                <SelectItem value="50to100">$50 - $100</SelectItem>
                <SelectItem value="over100">$100+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={instantOnly}
              onCheckedChange={(checked) => {
                setInstantOnly(Boolean(checked));
                setCurrentPage(1);
              }}
              disabled={!effectiveCategoryId}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Instant availability only</p>
              <p className="text-xs text-gray-500">
                Hide programs that require manual availability checks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={sortKey}
              onValueChange={(value) => setSortKey(value as SortKey)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Program name</SelectItem>
                <SelectItem value="annual_circulation">Annual circulation</SelectItem>
                <SelectItem value="average_order_value">Average order value</SelectItem>
                <SelectItem value="average_manual_check_response_time">
                  Manual response time
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"))}
            >
              Sort: {sortDirection === "asc" ? "Ascending" : "Descending"}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset filters
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={handleToggleSelectAll}
                    aria-checked={someVisibleSelected ? "mixed" : undefined}
                  />
                </th>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Avg Manual Response</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Annual Circulation</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3">Income</th>
                <th className="px-4 py-3">Female %</th>
                <th className="px-4 py-3">Male %</th>
                <th className="px-4 py-3">Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {loadingPrograms && (
                <tr>
                  <td colSpan={12} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                      <LoadingSpinner size="lg" />
                      Fetching programs...
                    </div>
                  </td>
                </tr>
              )}

              {!loadingPrograms && paginatedPrograms.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-sm text-gray-500">
                    {effectiveCategoryId
                      ? "No programs match your filters. Try adjusting them to see more results."
                      : "Programs will appear here once a category is selected."}
                  </td>
                </tr>
              )}

              {!loadingPrograms &&
                paginatedPrograms.map((program) => {
                  const programId = getProgramId(program);
                  const name = getProgramName(program);
                  const category = getProgramCategory(program) ?? "N/A";
                  const website = getProgramWebsite(program);
                  const websiteHref = getWebsiteHref(website);
                  const availabilityType = getAvailabilityType(program);
                  const annualCirculation = getAnnualCirculation(program);
                  const age =
                    getFieldValue(program, ["age", "age_range", "audience_age"]) ?? "N/A";
                  const income =
                    getFieldValue(program, ["income", "household_income", "average_income"]) ?? "N/A";
                  const femalePct =
                    getFieldValue(program, ["female_percentage", "female_percent", "female_pct"]) ??
                    null;
                  const malePct =
                    getFieldValue(program, ["male_percentage", "male_percent", "male_pct"]) ??
                    null;

                  return (
                    <tr key={programId} className="border-t text-sm hover:bg-gray-50">
                      <td className="px-4 py-3 align-top">
                        <Checkbox
                          checked={selectedPrograms.includes(programId)}
                          onCheckedChange={() => handleToggleProgram(programId)}
                          disabled={!effectiveCategoryId}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-gray-900">{name}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge
                          className={
                            availabilityType === "instant"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {availabilityType === "instant"
                            ? "Instant (AI pipeline)"
                            : "Manual check"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-top">{formatManualResponseTime(program)}</td>
                      <td className="px-4 py-3 align-top text-gray-700">{category}</td>
                      <td className="px-4 py-3 align-top">
                        {websiteHref ? (
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {(website || "").replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {annualCirculation !== null ? numberFormatter.format(annualCirculation) : "N/A"}
                      </td>
                      <td className="px-4 py-3 align-top">{age}</td>
                      <td className="px-4 py-3 align-top">{income}</td>
                      <td className="px-4 py-3 align-top">{formatPercent(femalePct)}</td>
                      <td className="px-4 py-3 align-top">{formatPercent(malePct)}</td>
                      <td className="px-4 py-3 align-top">{formatOrderValue(program)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {!loadingPrograms && paginatedPrograms.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-gray-600">
            <div>
              Showing {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(currentPage * PAGE_SIZE, sortedPrograms.length)} of {sortedPrograms.length}{" "}
              programs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Selected programs: {selectedPrograms.length}
            </p>
            <p className="text-xs text-gray-500">
              Instant: {selectionStats.instant} | Manual: {selectionStats.manual}
            </p>
          </div>
          {selectedPrograms.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedPrograms([])}>
              Clear selection
            </Button>
          )}
        </div>

        {selectedPrograms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedPrograms.map((programId) => {
              const program = programMap.get(programId);
              if (!program) return null;
              return (
                <Badge
                  key={programId}
                  variant="secondary"
                  className="flex items-center gap-2 rounded-full px-3 py-1"
                >
                  {getProgramName(program)}
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => handleToggleProgram(programId)}
                    aria-label="Remove program"
                  >
                    x
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Select at least one program to submit an availability check request.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
          <div className="text-sm text-gray-600">
            We&apos;ll submit availability checks for the programs you&apos;ve selected. Instant programs are
            processed automatically; manual programs will trigger an offline follow-up.
          </div>
          <Button
            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            disabled={selectedPrograms.length === 0 || submitting || !effectiveCategoryId}
            onClick={handleSubmitSelection}
          >
            {submitting ? (
              <>
                <LoadingSpinner className="mr-2" size="sm" />
                Submitting...
              </>
            ) : (
              "Submit Availability Check"
            )}
          </Button>
        </div>
      </div>

      {programsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load programs. Please refresh or adjust your filters.
        </div>
      )}
    </div>
  );
}

