"use client";

import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import {
  fetchOMSAudienceDetailsApi,
  omsIntegrationApi,
  verifyOMSIntegrationApi,
  getUSStateCodesApi,
} from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Lock, CheckCircle, Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistributionCenter {
  allocation_percentage: number;
  city: string;
  country_code: string;
  distribution_center_id: string;
  distribution_center_name: string;
  oms_feed_received: boolean;
  oms_record_count: number;
  ship_to_name: string;
  shipping_address_1: string;
  shipping_address_2: string;
  state: string;
  status: string;
  zip_code: string;
}

interface Channel {
  channel_id: string;
  channel_name: string;
  distribution_centers: DistributionCenter[];
  distribution_centers_count: number;
  oms_feed_received: boolean;
  status: string;
}

interface OMSAudienceDetailsData {
  all_oms_feed_received: boolean;
  audience_id: string;
  channels: Channel[];
  channels_count: number;
  local_audience_id: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OMSAudienceDetailsProps {
  audienceId: string;
}

export function OMSAudienceDetails({ audienceId }: OMSAudienceDetailsProps) {
  const router = useRouter();
  const userData = useMe();
  const ctx = useAtomValue(retailerSetupContextAtom);
  const setCtx = useSetAtom(retailerSetupContextAtom);

  const [omsData, setOmsData] = useState<OMSAudienceDetailsData | null>(null);
  const [stateCodes, setStateCodes] = useState<{ code: string; name: string }[]>([]);
  const [testOmsDialogOpen, setTestOmsDialogOpen] = useState(false);
  const [selectedDC, setSelectedDC] = useState<DistributionCenter | null>(null);
  const [formData, setFormData] = useState({
    city: "",
    state: "",
    zip: "",
    shipmentDate: "",
  });

  const [callFetchDetails, { loading, error }] = useApi({ errMsg: true });
  const [callTestOms, { loading: testingOms }] = useApi({ errMsg: true });
  const [callVerify, { loading: verifying }] = useApi({ errMsg: true });
  const [callStateCodes] = useApi({ errMsg: true });

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

  const fetchStateCodes = () => {
    callStateCodes(getUSStateCodesApi(), ({ data }: any) => {
      const codes = data?.state_codes ?? [];
      setStateCodes(codes.map((c: any) => ({ code: c.value, name: c.label })));
    });
  };

  useEffect(() => {
    fetchDetails();
    fetchStateCodes();
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

  const handleTestOmsClick = (dc: DistributionCenter) => {
    setSelectedDC(dc);
    setFormData({
      city: '',
      state: '',
      zip: '',
      shipmentDate: '',
    });
    setTestOmsDialogOpen(true);
  };

  const handleCloseTestOmsDialog = () => {
    setSelectedDC(null);
    setFormData({
      city: "",
      state: "",
      zip: "",
      shipmentDate: "",
    });
    setTestOmsDialogOpen(false);
  };

  const handleSubmitTestOms = () => {
    if (!selectedDC) return;
    callTestOms(
      omsIntegrationApi({
        audience_id: audienceId,
        current_step_name: "oms_integration",
        form_data: {
          distribution_center_salesforce_id: selectedDC.distribution_center_id,
          address1: selectedDC.shipping_address_1,
          address2: selectedDC.shipping_address_2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          shipment_date: formData.shipmentDate,
        },
      }),
      () => {
        setTestOmsDialogOpen(false);
        fetchDetails();
      }
    );
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

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order Management System</h1>
            <p className="text-sm text-gray-500 mt-1">
              Verify OMS integration for all distribution centers.
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
                  <Card key={channel.channel_id} className="overflow-hidden">
                    {/* Channel Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h3 className="font-semibold text-gray-900">
                            {channel.channel_name}
                          </h3>
                          <Badge className="bg-green-100 text-green-700">
                            {channel.status.charAt(0).toUpperCase() +
                              channel.status.slice(1)}
                          </Badge>
                          <Badge
                            className={
                              channel.oms_feed_received
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            OMS Testing:{" "}
                            {channel.oms_feed_received ? "Completed" : "Remaining"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Distribution Centers Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-6 py-3">Distribution Center</th>
                            <th className="px-6 py-3">OMS Testing</th>
                            <th className="px-6 py-3">Allocation %</th>
                            <th className="px-6 py-3">City</th>
                            <th className="px-6 py-3">State</th>
                            <th className="px-6 py-3">Ship To Name</th>
                            <th className="px-6 py-3">Shipping Address</th>
                            <th className="px-6 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {channel.distribution_centers.map((dc) => (
                            <tr key={dc.distribution_center_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {dc.distribution_center_name}
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  className={
                                    dc.oms_feed_received
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }
                                >
                                  {dc.oms_feed_received ? "Completed" : "Remaining"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {dc.allocation_percentage}%
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {dc.city}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {dc.state}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                {dc.ship_to_name}
                              </td>
                              <td className="px-6 py-4 text-gray-700">
                                <div>
                                  {dc.shipping_address_1}
                                  {dc.shipping_address_2 && (
                                    <div className="text-gray-500">
                                      {dc.shipping_address_2}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {!dc.oms_feed_received && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleTestOmsClick(dc)}
                                    className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                                  >
                                    Test OMS
                                  </Button>
                                )}
                                {dc.oms_feed_received && (
                                  <span className="text-xs text-gray-500 font-medium">
                                    Completed
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Info message */}
            {omsData.channels.length > 0 && !omsData.all_oms_feed_received && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 items-start">
                <p className="text-sm text-blue-700">
                  Test OMS integration for all distribution centers to complete this step.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Test OMS Dialog */}
      <Dialog open={testOmsDialogOpen} onOpenChange={handleCloseTestOmsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test OMS Integration</DialogTitle>
            <DialogDescription>
              Submit a test shipment log for{" "}
              {selectedDC?.distribution_center_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Enter city"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData({ ...formData, state: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {stateCodes.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) =>
                  setFormData({ ...formData, zip: e.target.value })
                }
                placeholder="Enter zip code"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shipmentDate">Shipment Date</Label>
              <Input
                id="shipmentDate"
                type="date"
                value={formData.shipmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, shipmentDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestOmsDialogOpen(false)}
              disabled={testingOms}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTestOms}
              disabled={
                testingOms ||
                !formData.city ||
                !formData.state ||
                !formData.zip ||
                !formData.shipmentDate
              }
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            >
              {testingOms ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Test Shipment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
