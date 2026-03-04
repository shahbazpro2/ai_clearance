"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "use-hook-api";
import {
  fetchManualAvailabilityCampaignDetailsApi,
  submitManualAvailabilityReviewApi,
  setCampaignBookedMediaCostApi,
} from "@/api/admin";
import { useCategories } from "@/hooks/useCategories";
import {
  formatMonthLabel,
  getOrderedMonthsFromEntries,
  normalizeMonthKey,
} from "@/lib/availability-months";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Pencil, Check, Download } from "lucide-react";
import { toast } from "react-toastify";

interface AvailabilityEntry {
  month: string;
  available: number;
  order_qty: number;
  reason?: string;
}

interface ProgramRow {
  channel_id: string;
  program_name: string;
  selected_freight: number;
  media_rate: number;
  media_cost: number | null;
  reviewed_by_agency: boolean;
  availability: AvailabilityEntry[];
  rawMetrics?: Record<string, unknown>;
  rawFreight?: Record<string, number>;
}

/** Parse programs from 6.2 GET campaign details response (data.programs array) */
function parseProgramsFromDetailsData(data: any): ProgramRow[] {
  const programs = data?.programs;
  if (!Array.isArray(programs)) return [];

  const rows: ProgramRow[] = programs.map((value: any) => {
    const channel_id = String(value?.program_id ?? value?.channel_id ?? "");
    const availability: AvailabilityEntry[] = Array.isArray(value?.availability)
      ? value.availability.map((e: any) => ({
        month: normalizeMonthKey(e?.month ?? ""),
        available: typeof e.available === "number" ? e.available : Number(e.available) || 0,
        order_qty: typeof e.order_qty === "number" ? e.order_qty : Number(e.order_qty) || 0,
        reason: typeof e.reason === "string" ? e.reason : e.reason ?? undefined,
      }))
      : [];
    const metrics = value?.metrics ?? {};
    const media_rate = typeof metrics.media_rate === "number" ? metrics.media_rate : Number(metrics.media_rate) || 0;
    const selected_freight =
      typeof metrics.selected_freight === "number"
        ? metrics.selected_freight
        : Number(metrics.selected_freight) || 0;

    const rawFreight: Record<string, number> = { selected_freight };
    Object.entries(metrics).forEach(([k, v]) => {
      if (k.startsWith("freight_") && typeof v === "number") rawFreight[k] = v;
    });

    let media_cost: number | null = null;
    if (value?.media_cost != null) {
      const n = Number(value.media_cost);
      media_cost = Number.isFinite(n) ? n : null;
    }

    return {
      channel_id,
      program_name: value?.program_name ?? value?.name ?? channel_id,
      selected_freight,
      media_rate,
      media_cost,
      reviewed_by_agency: value?.is_approved ?? value?.reviewed_by_agency ?? true,
      availability,
      rawMetrics: metrics,
      rawFreight,
    };
  });

  return rows;
}

export default function ManualAvailabilityReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = (params?.campaignId as string) ?? "";
  const fromBookingReview = searchParams?.get("from") === "booking-review";
  const fetchInstantPrograms = searchParams?.get("fetch_instant_programs") === "true";
  const { categoryNames } = useCategories();

  const [callDetails, { data: detailsData, loading: loadingDetails }] = useApi({ errMsg: true });
  const [callSave, { loading: saving }] = useApi({ errMsg: true });
  const [callSetMediaCost, { loading: savingMediaCost }] = useApi({ errMsg: true });

  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [editingMediaCostProgramId, setEditingMediaCostProgramId] = useState<string | null>(null);

  const data = detailsData?.data ?? detailsData;
  const confirmedCategoryId = data?.confirmed_category_id ?? null;
  const confirmedCategoryName =
    confirmedCategoryId != null && confirmedCategoryId !== ""
      ? (categoryNames[confirmedCategoryId] ?? confirmedCategoryId)
      : "—";
  const campaignName = data?.campaign_name ?? (campaignId || "—");
  const advertiserName = data?.user_name ?? data?.name ?? "—";
  const status = data?.status ?? "—";
  const requestId = data?.request_id ?? "";
  const programsCount = typeof data?.programs_count === "number" ? data.programs_count : 0;
  const isPending = String(status).toLowerCase() === "pending";
  const isEditable = isPending && !fromBookingReview;
  const isBookingReviewContext = fromBookingReview;

  useEffect(() => {
    if (campaignId) {
      callDetails(
        fetchManualAvailabilityCampaignDetailsApi(campaignId, {
          fetch_instant_programs: fetchInstantPrograms,
        })
      );
    }
  }, [campaignId, fetchInstantPrograms, callDetails]);

  useEffect(() => {
    if (data?.programs != null) {
      setPrograms(parseProgramsFromDetailsData(data));
    }
  }, [data]);

  const months = useMemo(
    () => getOrderedMonthsFromEntries(programs.flatMap((p) => p.availability)),
    [programs]
  );

  const updateProgram = useCallback((channelId: string, patch: Partial<ProgramRow>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.channel_id === channelId ? { ...p, ...patch } : p))
    );
  }, []);

  const updateAvailability = useCallback(
    (channelId: string, month: string, field: "available" | "order_qty" | "reason", value: number | string) => {
      setPrograms((prev) =>
        prev.map((p) => {
          if (p.channel_id !== channelId) return p;
          const avail = [...p.availability];
          const i = avail.findIndex((a) => a.month === month);
          const entry = i >= 0 ? { ...avail[i] } : { month, available: 0, order_qty: 0 };
          if (field === "available") entry.available = Number(value) || 0;
          else if (field === "order_qty") entry.order_qty = Number(value) || 0;
          else if (field === "reason") entry.reason = String(value);
          if (i >= 0) avail[i] = entry;
          else avail.push(entry);
          return { ...p, availability: avail };
        })
      );
    },
    []
  );

  const getAvailabilityEntry = useCallback(
    (p: ProgramRow, month: string): AvailabilityEntry => {
      return p.availability.find((a) => a.month === month) ?? { month, available: 0, order_qty: 0 };
    },
    []
  );

  const handleDownloadSpreadsheet = useCallback(() => {
    const headers = [
      "Program Name",
      "Selected Freight",
      "Media Rate",
      "Media Cost",
      "Is Approved",
      ...months.flatMap((m) => [
        `${formatMonthLabel(m)} Available`,
        `${formatMonthLabel(m)} Order Qty`,
        `${formatMonthLabel(m)} Reason`,
      ]),
    ];
    const rows = programs.map((p) => {
      const base = [
        p.program_name,
        p.selected_freight,
        p.media_rate,
        p.media_cost ?? "",
        p.reviewed_by_agency ? "Yes" : "No",
      ];
      const monthCells = months.flatMap((month) => {
        const e = getAvailabilityEntry(p, month);
        return [e.available, e.order_qty, e.reason ?? ""];
      });
      return [...base, ...monthCells];
    });
    const escape = (v: string | number) => {
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-details-${campaignId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Spreadsheet downloaded");
  }, [programs, months, campaignId, getAvailabilityEntry]);

  const handleSetMediaCost = useCallback(
    (programId: string, mediaCost: number) => {
      if (!campaignId) return;
      callSetMediaCost(
        setCampaignBookedMediaCostApi({
          campaign_id: campaignId,
          programs: { [programId]: { media_cost: mediaCost } },
        }),
        () => {
          toast.success("Media cost updated");
          setEditingMediaCostProgramId(null);
        }
      );
    },
    [campaignId, callSetMediaCost]
  );

  const handleSubmit = useCallback(() => {
    if (!campaignId || !requestId) {
      toast.error("Missing campaign or request ID");
      return;
    }

    const programsPayload: Record<
      string,
      {
        confirmed_availability: Record<string, number>;
        admin_notes?: string;
        reviewed_media_rate: number;
        isApproved: boolean;
        media_cost: number;
      }
    > = {};

    programs.forEach((p) => {
      // Build confirmed_availability object: { "May": 100000, "June": 100000, ... }
      const confirmed_availability: Record<string, number> = {};
      const notes: string[] = [];

      months.forEach((month) => {
        const e = getAvailabilityEntry(p, month);
        const monthLabel = formatMonthLabel(month);
        confirmed_availability[monthLabel] = e.available;
        if (e.reason && e.reason.trim()) {
          notes.push(`${monthLabel}: ${e.reason.trim()}`);
        }
      });

      programsPayload[p.channel_id] = {
        confirmed_availability,
        reviewed_media_rate: p.media_rate,
        isApproved: p.reviewed_by_agency,
        media_cost: p.media_cost ?? 0,
        ...(notes.length > 0 && { admin_notes: notes.join("; ") }),
      };
    });

    const payload = {
      campaign_id: campaignId,
      request_id: requestId,
      programs: programsPayload,
    };

    callSave(submitManualAvailabilityReviewApi(payload), () => {
      toast.success("Review submitted successfully");
      router.push(fromBookingReview ? "/admin/complete-booking-review" : "/admin/manual-availability-reviews");
    });
  }, [campaignId, requestId, programs, months, getAvailabilityEntry, callSave, router, fromBookingReview]);

  const loading = loadingDetails;

  if (loading && !data && !programs.length) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (!campaignId) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Invalid campaign.</p>
        <Link href={fromBookingReview ? "/admin/complete-booking-review" : "/admin/manual-availability-reviews"}>
          <Button variant="outline" className="mt-4">
            Back to list
          </Button>
        </Link>
      </main>
    );
  }

  const backHref = fromBookingReview ? "/admin/complete-booking-review" : "/admin/manual-availability-reviews";
  const backLabel = fromBookingReview ? "Back to Complete Booking Review" : "Back to Manual Availability Review";

  return (
    <main className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div><span className="font-medium text-gray-500">Campaign Name:</span> {campaignName}</div>
          <div><span className="font-medium text-gray-500">Advertiser:</span> {advertiserName}</div>
          <div><span className="font-medium text-gray-500">Confirmed category:</span> {confirmedCategoryName}</div>
          <div><span className="font-medium text-gray-500">Status:</span> <span className="capitalize">{String(status)}</span></div>
          <div><span className="font-medium text-gray-500">Programs count:</span> {programsCount > 0 ? programsCount : programs.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Manual Availability Review Table</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isBookingReviewContext
                  ? "From Complete Booking Review – media cost editable per program."
                  : isEditable
                    ? "Editable (pending review)."
                    : "Read-only (already reviewed)."}
              </p>
            </div>
            {programs.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownloadSpreadsheet}>
                <Download className="h-4 w-4 mr-2" />
                Download spreadsheet
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {programs.length === 0 && !loading ? (
            <p className="text-gray-500 py-4">No programs for this campaign.</p>
          ) : (
            <div className="space-y-6">
              {programs.map((p) => {
                const entry = (month: string) => getAvailabilityEntry(p, month);
                return (
                  <Card key={p.channel_id} className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{p.program_name}</CardTitle>
                      <div className="flex items-center flex-wrap gap-4 gap-y-2 text-sm text-muted-foreground mt-2">
                        <span>Selected freight: <strong className="text-foreground">{p.selected_freight}</strong></span>
                        <span className="flex items-center gap-2">
                          Media cost:
                          {isBookingReviewContext ? (
                            editingMediaCostProgramId === p.channel_id ? (
                              <span className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  className="w-24 h-8 inline"
                                  value={p.media_cost ?? ""}
                                  onChange={(e) =>
                                    updateProgram(p.channel_id, {
                                      media_cost: e.target.value === "" ? null : Number(e.target.value),
                                    })
                                  }
                                  placeholder="—"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cost = p.media_cost ?? 0;
                                    handleSetMediaCost(p.channel_id, cost);
                                  }}
                                  disabled={savingMediaCost}
                                  className="p-1 rounded hover:bg-gray-100 text-primary"
                                  aria-label="Save media cost"
                                >
                                  {savingMediaCost ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </button>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <strong className="text-foreground">{p.media_cost ?? "—"}</strong>
                                <button
                                  type="button"
                                  onClick={() => setEditingMediaCostProgramId(p.channel_id)}
                                  className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-foreground"
                                  aria-label="Edit media cost"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              </span>
                            )
                          ) : isEditable ? (
                            <Input
                              type="number"
                              className="w-24 h-8 inline"
                              value={p.media_cost ?? ""}
                              onChange={(e) =>
                                updateProgram(p.channel_id, {
                                  media_cost: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                              placeholder="—"
                            />
                          ) : (
                            <strong className="text-foreground">{p.media_cost ?? "—"}</strong>
                          )}
                        </span>
                        <span className="flex items-center gap-2">
                          Media rate:
                          {isEditable ? (
                            <Input
                              type="number"
                              className="w-24 h-8 inline"
                              value={p.media_rate}
                              onChange={(e) =>
                                updateProgram(p.channel_id, { media_rate: Number(e.target.value) || 0 })
                              }
                            />
                          ) : (
                            <strong className="text-foreground">{p.media_rate}</strong>
                          )}
                        </span>
                        <span className="flex items-center gap-3">
                          Approved:
                          {isEditable ? (
                            <>
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  name={`approved-${p.channel_id}`}
                                  checked={p.reviewed_by_agency === true}
                                  onChange={() => updateProgram(p.channel_id, { reviewed_by_agency: true })}
                                />
                                <span>Yes</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  name={`approved-${p.channel_id}`}
                                  checked={p.reviewed_by_agency === false}
                                  onChange={() => updateProgram(p.channel_id, { reviewed_by_agency: false })}
                                />
                                <span>No</span>
                              </label>
                            </>
                          ) : (
                            <strong className="text-foreground">
                              {p.reviewed_by_agency ? "Yes" : "No"}
                            </strong>
                          )}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Month</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Available</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Order qty</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-600">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {months.map((month) => {
                              const e = entry(month);
                              return (
                                <tr key={month} className="hover:bg-gray-50/50">
                                  <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                                    {formatMonthLabel(month)}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isEditable ? (
                                      <Input
                                        type="number"
                                        className="w-28 h-8"
                                        value={e.available || ""}
                                        onChange={(ev) =>
                                          updateAvailability(p.channel_id, month, "available", ev.target.value)
                                        }
                                      />
                                    ) : (
                                      e.available
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-600">{e.order_qty}</td>
                                  <td className="px-3 py-2">
                                    {isEditable ? (
                                      <Input
                                        className="w-40 h-8"
                                        value={e.reason ?? ""}
                                        onChange={(ev) =>
                                          updateAvailability(p.channel_id, month, "reason", ev.target.value)
                                        }
                                        placeholder="Optional"
                                      />
                                    ) : (
                                      e.reason ?? "—"
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {(isEditable || isBookingReviewContext) && programs.length > 0 && !isBookingReviewContext && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

