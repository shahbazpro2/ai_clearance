"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { getAudienceChannelsApi, verifyAudienceSetupStepApi } from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Lock, ChevronLeft } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Channel {
  channel_id: string;
  name: string;
  channel_type: string;
  status: "active" | "inactive";
  is_completed: boolean;
  is_dc_setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DistributionCenterChannelListProps {
  audienceId: string;
}

export function DistributionCenterChannelList({ audienceId }: DistributionCenterChannelListProps) {
  const router = useRouter();
  const userData = useMe();
  const ctx = useAtomValue(retailerSetupContextAtom);
  const setCtx = useSetAtom(retailerSetupContextAtom);

  const [channels, setChannels] = useState<Channel[]>([]);

  const [callFetch, { loading, error }] = useApi({ errMsg: true });
  const [callVerify, { loading: verifying }] = useApi({ errMsg: true });

  const fetchChannels = () => {
    callFetch(getAudienceChannelsApi(audienceId), ({ data }: any) => {
      setChannels(data?.audience_channels ?? []);
    });
  };

  useEffect(() => {
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceId]);

  // Restrict access for retailer role
  if (userData && userData.role === "retailer") {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto mt-12">
            <Card>
              <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Access Restricted
                </h2>
                <p className="text-sm text-gray-600 max-w-xs">
                  This page is only available for setup administrators. Please contact your account manager.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const activeChannels = channels.filter((c) => c.status === "active");
  const allDCCompleted = activeChannels.length > 0 && activeChannels.every((c) => c.is_dc_setup_completed);

  const handleSetupDC = (channel: Channel) => {
    router.push(
      `/retailer/audiences/setup/step/${audienceId}/4/distribution-centers/${channel.channel_id}`
    );
  };

  const handleNext = () => {
    callVerify(
      verifyAudienceSetupStepApi({
        audience_id: audienceId,
        current_step_name: "distribution_center",
      }),
      ({ data }: any) => {
        const nextStep = data?.next_step ?? 5;
        if (ctx) {
          setCtx({ ...ctx, currentStep: nextStep });
        }
        router.push(`/retailer/audiences/setup/step/${audienceId}/${nextStep}`);
      }
    );
  }; const handleBack = () => {
    if (ctx) {
      setCtx({ ...ctx, currentStep: 2 });
    }
    router.push(`/retailer/audiences/setup/step/${audienceId}/2`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SetupProgressHeader stepOverride={4} />

      {/* Back navigation bar */}
      <div className="bg-white border-b sticky top-14 z-20">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Category Exclusions
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Distribution Center Setup</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure distribution centers for each channel.
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
              disabled={!allDCCompleted || verifying}
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

        {/* Loading */}
        {loading && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-gray-500">
              <LoadingSpinner size="lg" />
              Loading channels...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-600">Failed to load channels.</p>
            <Button variant="outline" size="sm" onClick={fetchChannels}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            {channels.length === 0 ? (
              <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                No channels found for this audience.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">DC Setup</th>
                        <th className="px-4 py-3">Updated At</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {channels.map((channel) => {
                        /*  const showButton = !channel.is_dc_setup_completed && channel.status === "active"; */
                        const showButton = true;

                        return (
                          <tr key={channel.channel_id} className="border-t hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {channel.channel_type}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={channel.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                                {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                className={
                                  channel.is_dc_setup_completed
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }
                              >
                                {channel.is_dc_setup_completed ? "Completed" : "Pending"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatDate(channel.updated_at)}
                            </td>
                            <td className="px-4 py-3">
                              {showButton && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSetupDC(channel)}
                                  className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                                >
                                  Setup Distribution Center
                                </Button>
                              )}
                              {/*  {channel.is_dc_setup_completed && (
                                <span className="text-xs text-gray-500 font-medium">Completed</span>
                              )} */}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Info message */}
            {activeChannels.length > 0 && !allDCCompleted && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 items-start">
                <p className="text-sm text-blue-700">
                  Configure distribution centers for all active channels to proceed to the next step.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
