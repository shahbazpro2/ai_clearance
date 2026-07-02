"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import {
  downloadOmsDcDetailsPdfApi,
  fetchDcShipmentLogsApi,
  fetchOMSAudienceDetailsApi,
} from "@/api/retailer";
import {
  DistributionCenter,
  OMSAudienceDetailsData,
  ShipmentLogsResponse,
} from "@/components/retailer/oms/types";

export function useOmsAudienceDetails(audienceId: string) {
  const [omsData, setOmsData] = useState<OMSAudienceDetailsData | null>(null);
  const [shipmentLogsDialogOpen, setShipmentLogsDialogOpen] = useState(false);
  const [shipmentLogsData, setShipmentLogsData] = useState<ShipmentLogsResponse | null>(null);
  const [shipmentLogsError, setShipmentLogsError] = useState<string | null>(null);

  const [callFetchDetails, { loading, error }] = useApi({ errMsg: true });
  const [callDownloadPdf, { loading: downloadingPdf }] = useApi({ errMsg: true });
  const [callFetchShipmentLogs, { loading: loadingShipmentLogs }] = useApi({ errMsg: true });

  const fetchDetails = () => {
    callFetchDetails(
      fetchOMSAudienceDetailsApi({
        audience_id: audienceId,
        ignore_status: false,
      }),
      ({ data }: any) => {
        setOmsData(data);
      }
    );
  };

  const downloadDcRecords = () => {
    callDownloadPdf(downloadOmsDcDetailsPdfApi(audienceId));
  };

  const openShipmentLogs = (dc: DistributionCenter) => {
    setShipmentLogsDialogOpen(true);
    setShipmentLogsData(null);
    setShipmentLogsError(null);

    callFetchShipmentLogs(
      fetchDcShipmentLogsApi(dc.distribution_center_id),
      ({ data }: any) => {
        setShipmentLogsData(data);
      },
      () => {
        setShipmentLogsError("Failed to load shipment logs.");
      }
    );
  };

  const closeShipmentLogs = (open: boolean) => {
    setShipmentLogsDialogOpen(open);
    if (!open) {
      setShipmentLogsData(null);
      setShipmentLogsError(null);
    }
  };

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceId]);

  return {
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
  };
}
