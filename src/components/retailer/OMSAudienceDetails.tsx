"use client";

import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { verifyOMSIntegrationApi } from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { OMSChannelCard } from "@/components/retailer/oms/OMSChannelCard";
import { OMSShipmentLogsDialog } from "@/components/retailer/oms/OMSShipmentLogsDialog";
import { useOmsAudienceDetails } from "@/components/retailer/oms/useOmsAudienceDetails";
import { RefreshCw, Lock, ChevronLeft, FileDown } from "lucide-react";

// ─── Component ────────────────────────────────────────────────────────────────

interface OMSAudienceDetailsProps {
  audienceId: string;
}

export function OMSAudienceDetails({ audienceId }: OMSAudienceDetailsProps) {
  const router = useRouter();
  const userData = useMe();
  const ctx = useAtomValue(retailerSetupContextAtom);
  const setCtx = useSetAtom(retailerSetupContextAtom);
  const [callVerify, { loading: verifying }] = useApi({ errMsg: true });
  const {
    downloadingPdf,
    error,
    fetchDetails,
    loading,
    loadingShipmentLogs,
    omsData,
    shipmentLogsData,
    shipmentLogsDialogOpen,
    shipmentLogsError,
    closeShipmentLogs,
    downloadDcRecords,
    openShipmentLogs,
  } = useOmsAudienceDetails(audienceId);

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

  const handleBack = () => {
    if (ctx) {
      setCtx({ ...ctx, currentStep: 4 });
    }
    router.push(`/retailer/audiences/setup/step/${audienceId}/4`);
  };

  const handleDownloadDCRecords = () => {
    downloadDcRecords();
  };

  const handleVerify = () => {
    callVerify(
      verifyOMSIntegrationApi({ audience_id: audienceId }),
      () => {
        router.push(`/retailer/audiences`);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SetupProgressHeader stepOverride={5} />

      <div className="bg-white border-b sticky top-14 z-20">
        <div className="container mx-auto px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Distribution Center Setup
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Shipment Log Data Feeds</h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up and verify shipment log data feeds for all distribution centers using the Data Feed Integration Guide.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchDetails}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleDownloadDCRecords}
              disabled={downloadingPdf}
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <FileDown className="h-4 w-4 mr-2" />
              {downloadingPdf ? "Downloading..." : "Data Feed Integration Guide"}
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!omsData?.all_oms_feed_received || verifying}
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            >
              {verifying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify & Complete Setup"
              )}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="py-16 flex items-center justify-center gap-2 text-sm text-gray-500">
              <LoadingSpinner size="lg" />
              Loading OMS audience details...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-red-600">Failed to load OMS audience details.</p>
            <Button variant="outline" size="sm" onClick={fetchDetails}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Channels & DCs */}
        {!loading && !error && omsData && (
          <>
            {omsData.channels.length === 0 ? (
              <div className="rounded-xl border bg-white shadow-sm py-12 text-center text-sm text-gray-500">
                No channels found for this audience.
              </div>
            ) : (
              <div className="space-y-4">
                {omsData.channels.map((channel) => (
                  <OMSChannelCard
                    key={channel.channel_id}
                    channel={channel}
                    onViewShipmentLogs={openShipmentLogs}
                  />
                ))}
              </div>
            )}

            {/* Info message */}
            {omsData.channels.length > 0 && !omsData.all_oms_feed_received && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 items-start">
                <p className="text-sm text-blue-700">
                  Shipment log data feeds must be completed for all distribution centers to finish this step.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <OMSShipmentLogsDialog
        data={shipmentLogsData}
        error={shipmentLogsError}
        loading={loadingShipmentLogs}
        onOpenChange={closeShipmentLogs}
        open={shipmentLogsDialogOpen}
      />
    </div>
  );
}
