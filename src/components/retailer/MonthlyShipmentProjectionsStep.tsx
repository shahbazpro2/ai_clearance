"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import {
  getAudienceChannelsApi,
  getMonthlyShipmentProjectionsByChannelApi,
  saveMonthlyShipmentProjectionsApi,
  verifyMonthlyShipmentProjectionsStepApi,
} from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, ChevronLeft, Lock, RefreshCw } from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

type MonthName = (typeof MONTHS)[number];

interface Channel {
  channel_id: string;
  channel_type: string;
  status: "active" | "inactive";
  monthly_projections_completed: boolean;
  updated_at: string;
}

type ProjectionFormValues = Record<MonthName, string>;

type MonthlyProjectionPayload = Record<MonthName, number | null>;

const quantityFieldSchema = z
  .string()
  .min(1, "Required")
  .refine(
    (value) => Number(value) % 25000 === 0,
    "Quantity must be entered in increments of 25,000",
  );

const monthlyProjectionSchema = z.object(
  MONTHS.reduce((schema, month) => {
    schema[month] = quantityFieldSchema;
    return schema;
  }, {} as Record<MonthName, typeof quantityFieldSchema>),
);

function createEmptyFormValues(): ProjectionFormValues {
  return MONTHS.reduce((acc, month) => {
    acc[month] = "";
    return acc;
  }, {} as ProjectionFormValues);
}

function formatDateTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function formatChannelStatus(status: Channel["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function normalizeProjectionValues(
  monthlyProjections?: Partial<Record<MonthName, number | null>>,
): ProjectionFormValues {
  return MONTHS.reduce((acc, month) => {
    const value = monthlyProjections?.[month];
    acc[month] = value === null || value === undefined ? "" : String(value);
    return acc;
  }, {} as ProjectionFormValues);
}

function buildProjectionPayload(
  formValues: ProjectionFormValues,
): MonthlyProjectionPayload {
  return MONTHS.reduce((acc, month) => {
    const rawValue = formValues[month].trim();
    acc[month] = rawValue === "" ? null : Number(rawValue);
    return acc;
  }, {} as MonthlyProjectionPayload);
}

function extractMonthlyProjections(
  response: any,
  channelId?: string,
): Partial<Record<MonthName, number | null>> | undefined {
  const payload = response?.data ?? response;

  if (payload?.monthly_projections) {
    return payload.monthly_projections;
  }

  const channelData =
    payload?.channels?.find((entry: any) => entry.channel_id === channelId) ??
    payload?.channels?.[0];

  return channelData?.monthly_projections;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </div>
  );
}

interface MonthlyShipmentProjectionsDialogProps {
  audienceId: string;
  channel: Channel | null;
  open: boolean;
  onClose: () => void;
  onSaved: (channel: Channel) => void;
}

function MonthlyShipmentProjectionsDialog({
  audienceId,
  channel,
  open,
  onClose,
  onSaved,
}: MonthlyShipmentProjectionsDialogProps) {
  const [callFetchProjections, { loading: loadingProjections, error: fetchError }] =
    useApi({ errMsg: true });
  const [callSave, { loading: saving, error: saveError }] = useApi({
    errMsg: true,
  });

  const [originalValues, setOriginalValues] = useState<ProjectionFormValues | null>(null);

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ProjectionFormValues>({
    resolver: zodResolver(monthlyProjectionSchema) as any,
    mode: "onChange",
    defaultValues: createEmptyFormValues(),
  });

  const watchedValues = watch();

  const hasChanges = useMemo(() => {
    if (!originalValues) return false; // No original data yet — keep disabled
    return MONTHS.some((month) => {
      const orig = originalValues[month];
      const curr = watchedValues[month];
      return String(orig ?? "") !== String(curr ?? "");
    });
  }, [watchedValues, originalValues]);

  useEffect(() => {
    if (!open || !channel) {
      setOriginalValues(null);
      reset(createEmptyFormValues());
      return;
    }

    setOriginalValues(null);

    callFetchProjections(
      getMonthlyShipmentProjectionsByChannelApi(channel.channel_id),
      ({ data }: any) => {
        const normalized = normalizeProjectionValues(
          extractMonthlyProjections(data, channel.channel_id),
        );
        setOriginalValues(normalized);
        reset(normalized);
      },
      () => {
        const empty = createEmptyFormValues();
        setOriginalValues(empty);
        reset(empty);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channel?.channel_id]);

  const onSubmit: SubmitHandler<ProjectionFormValues> = (formValues) => {
    if (!channel) return;

    // If nothing changed, just close the dialog without saving
    if (originalValues && !hasChanges) {
      onClose();
      return;
    }

    callSave(
      saveMonthlyShipmentProjectionsApi({
        audience_id: audienceId,
        channel_id: channel.channel_id,
        monthly_projections: buildProjectionPayload(formValues),
      }),
      () => {
        onSaved(channel);
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="max-w-3xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Monthly Shipment Projections</DialogTitle>
          <DialogDescription>
            Fill in the projected quantities of insert-eligible shipments for
            each month for {channel?.channel_type ?? "this channel"}.
          </DialogDescription>
        </DialogHeader>

        {loadingProjections ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
              <LoadingSpinner size="lg" />
              Loading monthly shipment projections...
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <p className="text-sm text-red-600">
              Failed to load monthly shipment projections.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!channel) return;
                callFetchProjections(
                  getMonthlyShipmentProjectionsByChannelApi(channel.channel_id),
                  ({ data }: any) => {
                    const normalized = normalizeProjectionValues(
                      extractMonthlyProjections(data, channel.channel_id),
                    );
                    setOriginalValues(normalized);
                    reset(normalized);
                  },
                );
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {MONTHS.map((month) => (
                <div key={month}>
                  <Label className="mb-1.5 block text-sm font-medium">
                    {month} Availability
                  </Label>
                  <Input
                    {...register(month, {
                      onChange: (event) => {
                        event.target.value = event.target.value.replace(
                          /\D/g,
                          "",
                        );
                      },
                    })}
                    inputMode="numeric"
                    placeholder="25000"
                    disabled={saving}
                  />
                  <FieldError message={errors[month]?.message} />
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-700">
                Enter values in increments of 25,000.
              </p>
            </div>

            {saveError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">
                  Failed to save monthly shipment projections.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={saving || !hasChanges || !isValid}
                className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                title={
                  !hasChanges
                    ? "No changes made yet — modify a value to enable saving"
                    : !isValid
                      ? "Fill in all required fields correctly"
                      : ""
                }
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MonthlyShipmentProjectionsStepProps {
  audienceId: string;
}

export function MonthlyShipmentProjectionsStep({
  audienceId,
}: MonthlyShipmentProjectionsStepProps) {
  const router = useRouter();
  const userData = useMe();
  const ctx = useAtomValue(retailerSetupContextAtom);
  const setCtx = useSetAtom(retailerSetupContextAtom);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [callFetchChannels, { loading, error }] = useApi({ errMsg: true });
  const [callVerify, { loading: verifying }] = useApi({ errMsg: true });

  const fetchChannels = () => {
    callFetchChannels(getAudienceChannelsApi(audienceId), ({ data }: any) => {
      const payload = data?.data ?? data;
      setChannels(payload?.audience_channels ?? []);
    });
  };

  useEffect(() => {
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceId]);

  const pendingCount = useMemo(
    () =>
      channels.filter((channel) => !channel.monthly_projections_completed)
        .length,
    [channels],
  );

  if (userData && userData.role === "retailer") {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto mt-12 max-w-2xl">
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 pt-12 pb-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Access Restricted
                </h2>
                <p className="max-w-xs text-sm text-gray-600">
                  This page is only available for setup administrators. Please
                  contact your account manager.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const handleBack = () => {
    if (ctx) {
      setCtx({ ...ctx, currentStep: 4 });
    }
    router.push(`/retailer/audiences/setup/step/${audienceId}/4`);
  };

  const handleOpenDialog = (channel: Channel) => {
    setVerifyMessage(null);
    setSaveMessage(null);
    setSelectedChannel(channel);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedChannel(null);
  };

  const handleSaved = (channel: Channel) => {
    setDialogOpen(false);
    setSelectedChannel(null);
    setSaveMessage(
      `Monthly shipment projections saved for ${channel.channel_type}.`,
    );
    fetchChannels();
  };

  const handleNext = () => {
    setVerifyMessage(null);
    callVerify(
      verifyMonthlyShipmentProjectionsStepApi({ audience_id: audienceId }),
      ({ data }: any) => {
        const payload = data?.data ?? data;
        const allCompleted =
          payload?.all_channels_monthly_projections_completed === true;

        if (!allCompleted) {
          setVerifyMessage(
            "Complete monthly shipment projections for all channels before continuing to OMS Integration.",
          );
          fetchChannels();
          return;
        }

        const nextStep = payload?.next_step ?? 6;
        if (ctx) {
          setCtx({ ...ctx, currentStep: nextStep });
        }
        router.push(`/retailer/audiences/setup/step/${audienceId}/${nextStep}`);
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SetupProgressHeader stepOverride={5} />

      <div className="sticky top-14 z-20 border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Distribution Center Setup
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Monthly Shipment Projections
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the projected quantities of insert-eligible shipments for
              each channel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchChannels}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleNext}
              disabled={channels.length === 0 || verifying}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            >
              {verifying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <LoadingSpinner size="lg" />
              Loading channels...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <p className="text-sm text-red-600">Failed to load channels.</p>
            <Button variant="outline" size="sm" onClick={fetchChannels}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {saveMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">{saveMessage}</p>
              </div>
            )}

            {verifyMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-sm text-amber-700">{verifyMessage}</p>
              </div>
            )}

            {channels.length === 0 ? (
              <div className="rounded-xl border bg-white py-12 text-center text-sm text-gray-500 shadow-sm">
                No channels found for this audience.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Completed</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Updated At</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map((channel) => (
                        <tr
                          key={channel.channel_id}
                          className="border-t transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {channel.channel_type}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                channel.monthly_projections_completed
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {channel.monthly_projections_completed
                                ? "Completed"
                                : "Pending"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                channel.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }
                            >
                              {formatChannelStatus(channel.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDateTime(channel.updated_at)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              onClick={() => handleOpenDialog(channel)}
                              className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                            >
                              Set Projections
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


          </>
        )}
      </main>

      <MonthlyShipmentProjectionsDialog
        audienceId={audienceId}
        channel={selectedChannel}
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
      />
    </div>
  );
}
