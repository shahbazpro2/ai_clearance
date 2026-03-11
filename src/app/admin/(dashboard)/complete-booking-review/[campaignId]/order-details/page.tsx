"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "use-hook-api";
import {
  fetchSalesforceOrderDetailsApi,
  pushSalesforceOrdersApi,
} from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "react-toastify";

interface InsertionOrderItem {
  booking_month: string;
  quantity: number;
  salesforce_order_id: string;
}

interface InsertionOrderProgram {
  program_name: string;
  Buyer_Gross_Base_Price__c?: number;
  Freight__c?: number;
  Needs_Printed__c?: boolean;
  Print_Rate__c?: number;
  Seller_Net_Base_Price__c?: number;
  insertion_salesforce_order_ids?: InsertionOrderItem[];
}

interface ProductionOrderDetails {
  production_order_salesforce_id?: string;
  Buyer_Flat_Fee__c?: number;
  Quantity__c?: number;
}

interface SalesforceOrderDetailsData {
  Billing_Account__c?: string;
  Buying_Advertiser_Account__c?: string;
  Insert_Category__c?: string;
  Insert_Format__c?: string;
  campaign_id?: string;
  created_at?: string;
  updated_at?: string;
  created_orders?: number;
  salesforce_order_pushed?: boolean | string;
  production_order_details?: ProductionOrderDetails;
  insertion_order_details?: Record<string, InsertionOrderProgram>;
}

function formatBookingMonth(month: string): string {
  if (!month) return month;
  const [y, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = parseInt(m, 10);
  return idx >= 1 && idx <= 12 ? `${months[idx - 1]} ${y}` : month;
}

export default function SalesforceOrderDetailsPage() {
  const params = useParams();
  const campaignId = (params?.campaignId as string) ?? "";
  const [getDetails, { data: detailsData, loading: loadingDetails }] = useApi({
    errMsg: true,
  });
  const [pushOrders, { loading: pushing }] = useApi({ errMsg: true });

  const [billingAccountId, setBillingAccountId] = useState("");
  const [buyingAdvertiserAccountId, setBuyingAdvertiserAccountId] = useState("");

  const data: SalesforceOrderDetailsData | null =
    detailsData?.data ?? detailsData ?? null;
  const salesforceOrderPushed =
    data?.salesforce_order_pushed === true ||
    data?.salesforce_order_pushed === "true";
  const productionOrder = data?.production_order_details ?? {};
  const insertionOrders = data?.insertion_order_details ?? {};
  const insertionEntries = Object.entries(insertionOrders);

  useEffect(() => {
    if (campaignId) {
      getDetails(fetchSalesforceOrderDetailsApi(campaignId));
    }
  }, [campaignId, getDetails]);

  useEffect(() => {
    if (data) {
      if (data.Billing_Account__c != null)
        setBillingAccountId(String(data.Billing_Account__c));
      if (data.Buying_Advertiser_Account__c != null)
        setBuyingAdvertiserAccountId(String(data.Buying_Advertiser_Account__c));
    }
  }, [data?.Billing_Account__c, data?.Buying_Advertiser_Account__c]);

  const canPush =
    !salesforceOrderPushed &&
    billingAccountId.trim() !== "" &&
    buyingAdvertiserAccountId.trim() !== "";

  const handlePushToSalesforce = useCallback(() => {
    if (!campaignId || !canPush) return;
    pushOrders(
      pushSalesforceOrdersApi({
        campaign_id: campaignId,
        billing_account_id: billingAccountId.trim(),
        buying_advertiser_account_id: buyingAdvertiserAccountId.trim(),
      }),
      () => {
        toast.success("Data pushed to Salesforce");
        getDetails(fetchSalesforceOrderDetailsApi(campaignId));
      }
    );
  }, [
    campaignId,
    billingAccountId,
    buyingAdvertiserAccountId,
    canPush,
    pushOrders,
    getDetails,
  ]);

  if (loadingDetails && !data) {
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
        <Link href="/admin/complete-booking-review">
          <Button variant="outline" className="mt-4">
            Back to Complete Booking Review
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/admin/complete-booking-review/${campaignId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign Details
        </Link>
      </Button>

      <h1 className="text-2xl font-bold mb-6">Booked Campaign Review Details</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Campaign & Billing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <label className="font-medium text-gray-500 block mb-1">
              Billing Account Id
            </label>
            {salesforceOrderPushed ? (
              <span className="text-foreground">
                {data?.Billing_Account__c ?? "—"}
              </span>
            ) : (
              <Input
                value={billingAccountId}
                onChange={(e) => setBillingAccountId(e.target.value)}
                placeholder="Enter Billing Advertiser ID"
                className="max-w-md"
              />
            )}
          </div>
          <div>
            <label className="font-medium text-gray-500 block mb-1">
              Buyer Advertiser Account Id
            </label>
            {salesforceOrderPushed ? (
              <span className="text-foreground">
                {data?.Buying_Advertiser_Account__c ?? "—"}
              </span>
            ) : (
              <Input
                value={buyingAdvertiserAccountId}
                onChange={(e) => setBuyingAdvertiserAccountId(e.target.value)}
                placeholder="Enter Buyer Advertiser Account ID"
                className="max-w-md"
              />
            )}
          </div>
          <div>
            <span className="font-medium text-gray-500">Confirmed Category:</span>{" "}
            {data?.Insert_Category__c ?? "—"}
          </div>
          <div>
            <span className="font-medium text-gray-500">Insert Format Type:</span>{" "}
            {data?.Insert_Format__c ?? "—"}
          </div>
          <div>
            <span className="font-medium text-gray-500">Created At:</span>{" "}
            {data?.created_at ? formatDate(data.created_at) : "—"}
          </div>
          <div>
            <span className="font-medium text-gray-500">Updated At:</span>{" "}
            {data?.updated_at ? formatDate(data.updated_at) : "—"}
          </div>
          <div>
            <span className="font-medium text-gray-500">Created Orders:</span>{" "}
            {data?.created_orders != null ? data.created_orders : "—"}
          </div>
          {!salesforceOrderPushed && canPush && (
            <div className="pt-4">
              <Button onClick={handlePushToSalesforce} disabled={pushing}>
                {pushing && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Push Data to Salesforce
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Production Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="font-medium text-gray-500">Order Id:</span>{" "}
            {productionOrder.production_order_salesforce_id ?? "—"}
          </div>
          <div>
            <span className="font-medium text-gray-500">Buyer Flat Fee:</span>{" "}
            {productionOrder.Buyer_Flat_Fee__c ?? "—"}
          </div>
          <div>
            <span className="font-medium text-gray-500">Total Quantity:</span>{" "}
            {productionOrder.Quantity__c ?? "—"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insertion Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          {insertionEntries.length === 0 ? (
            <p className="text-gray-500 text-sm">No insertion order details.</p>
          ) : (
            <div className="space-y-6">
              {insertionEntries.map(([programId, program]) => {
                const rows = program.insertion_salesforce_order_ids ?? [];
                return (
                  <div
                    key={programId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Program Name:</span>{" "}
                        {program.program_name ?? "—"}
                      </div>
                      <div>
                        <span className="text-gray-500">Program Id:</span>{" "}
                        {programId}
                      </div>
                      <div>
                        <span className="text-gray-500">Buyer Gross Base Price:</span>{" "}
                        {program.Buyer_Gross_Base_Price__c ?? "—"}
                      </div>
                      <div>
                        <span className="text-gray-500">Freight:</span>{" "}
                        {program.Freight__c ?? "—"}
                      </div>
                      <div>
                        <span className="text-gray-500">Needs Printed:</span>{" "}
                        {program.Needs_Printed__c != null
                          ? program.Needs_Printed__c
                            ? "Yes"
                            : "No"
                          : "—"}
                      </div>
                      <div>
                        <span className="text-gray-500">Print Rate:</span>{" "}
                        {program.Print_Rate__c ?? "—"}
                      </div>
                      <div>
                        <span className="text-gray-500">Seller Net Base Price:</span>{" "}
                        {program.Seller_Net_Base_Price__c ?? "—"}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border rounded">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                              Month Name
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                              Order Id
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-3 py-2 text-gray-500">
                                No booking months
                              </td>
                            </tr>
                          ) : (
                            rows.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">
                                  {formatBookingMonth(row.booking_month)}
                                </td>
                                <td className="px-3 py-2">{row.quantity}</td>
                                <td className="px-3 py-2 font-mono text-xs">
                                  {row.salesforce_order_id ?? "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
