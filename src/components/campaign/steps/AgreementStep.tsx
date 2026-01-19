"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { campaignIdAtom } from "@/store/campaign";
import {
  getArtAndCsvDetailsApi,
  acceptAgreementApi,
} from "../../../../api/campaigns";

interface MediaPlanItem {
  amount: number;
  booking_month: string;
  insert_program: string;
  quantity: number;
}

interface AgreementDetails {
  campaign_id: string;
  client_name: string;
  date: string;
  media_plan: MediaPlanItem[];
  total_amount: number;
}

interface AgreementStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function AgreementStep({ onBack, onNext }: AgreementStepProps) {
  const campaignId = useAtomValue(campaignIdAtom);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementDetails, setAgreementDetails] =
    useState<AgreementDetails | null>(null);

  const [
    callGetDetails,
    { data: detailsData, loading: loadingDetails },
  ] = useApi({
    errMsg: true,
    cache: "agreementDetails",
    unmount: true,
  });

  const [callAcceptAgreement, { loading: accepting }] = useApi({
    both: true,
    resSuccessMsg: "Agreement accepted successfully",
  });

  // Fetch agreement details on mount
  useEffect(() => {
    if (campaignId) {
      callGetDetails(getArtAndCsvDetailsApi(campaignId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Process agreement details data
  useEffect(() => {
    if (detailsData) {
      const data = detailsData?.data || detailsData;
      setAgreementDetails(data);
    }
  }, [detailsData]);

  const handleAcceptAgreement = () => {
    if (!campaignId) {
      toast.error("Campaign ID is missing");
      return;
    }

    if (!agreementAccepted) {
      toast.error("Please accept the agreement to continue");
      return;
    }

    callAcceptAgreement(
      acceptAgreementApi({ campaign_id: campaignId }),
      () => {
        // On success, proceed to payment step
        onNext();
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loadingDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-4 text-gray-600">Loading agreement details...</span>
      </div>
    );
  }

  if (!agreementDetails) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No agreement details found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statement of Work Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Statement of Work No. 1
        </h2>
        <p className="text-gray-600">
          This Statement of Work is effective as of the date of the last
          signature {agreementDetails.date || ""}, by and between Red Crane
          Media (&quot;RCM&quot;) and {agreementDetails.client_name} (the &quot;Client&quot;).
        </p>
      </div>

      {/* Scope of Work */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            SCOPE OF WORK
          </h3>
          <p className="text-gray-700 mb-4">
            This scope of work will be completed in the following 4 stages:
          </p>

          <div className="space-y-4 text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">Stage 1: Insert Production</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  RCM will perform pre-press quality control on the art-file(s) provided by
                  Client and request any needed changes.
                </li>
                <li>
                  RCM will provide a final proof(s) for approval, by Client, before printing.
                </li>
                <li>
                  RCM will complete the printing of inserts.
                </li>
                <li>
                  RCM will create a tracking spreadsheet, showing the allocation of
                  keycodes by all variables being tested, such as program, format, and
                  offer.
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Stage 2: Insert Shipping</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  RCM will package the inserts into convenient cartons on skids, according
                  to the quantities and number of shipments for each program. Each skid
                  will be distinctly labeled for tracking throughout the delivery and
                  distribution process.
                </li>
                <li>
                  RCM will send out all shipments according to the shipping addresses and
                  instructions obtained from each program listed in the media plan.
                </li>
                <li>
                  RCM will ensure each program receives their allotted material.
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                Stage 3: Monitoring Distribution
              </h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  RCM will confirm that insert distribution has started for each program.
                </li>
                <li>
                  RCM will periodically request the quantity of inserts remaining from each
                  program and update the Client.
                </li>
                <li>
                  RCM will promptly resolve any issues that arise during insert distribution.
                </li>
                <li>
                  RCM will confirm that insert distribution has completed for each program.
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Stage 4: Analyzing Results</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  RCM will create reporting that shows the total conversions and
                  conversion rate for each program and each variable being tested.
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Plan */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 underline">
            MEDIA PLAN
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Insert Program
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Booking Month
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {agreementDetails.media_plan.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-700">
                      {item.insert_program}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {item.booking_month}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={2} className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-gray-900">
                    {formatCurrency(agreementDetails.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Compensation Terms */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 underline">
            COMPENSATION: TERMS
          </h3>
          <p className="text-gray-700">
            The total cost for insert printing, shipping, and distribution is{" "}
            {agreementDetails.total_amount.toLocaleString()}. This is invoiced
            upon signature of this Statement of Work and due{" "}
            {agreementDetails.date || ""}.
          </p>
        </CardContent>
      </Card>

      {/* Acceptance Priority */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 underline">
            ACCEPTANCE: PRIORITY
          </h3>
          <p className="text-gray-700">
            This Statement of Work is made pursuant to the Master Services Agreement.
            Upon execution by both parties, the Agreement is incorporated into this
            Statement of Work, and made subject to the Master Services Agreement’s
            terms and conditions, except where there is a direct disagreement between the
            terms of the two documents, in which case the term in this Statement of Work
            shall be considered a duly-authorized modification and shall supersede the
            term in the Master Services Agreement.
          </p>
        </CardContent>
      </Card>

      {/* Acceptance Checkbox */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="accept-agreement"
              checked={agreementAccepted}
              onCheckedChange={(checked) =>
                setAgreementAccepted(checked === true)
              }
            />
            <label
              htmlFor="accept-agreement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700"
            >
              I accept the terms and conditions of this Statement of Work
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={onBack} disabled={accepting}>
          Back
        </Button>
        <Button
          onClick={handleAcceptAgreement}
          disabled={!agreementAccepted || accepting}
          className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
        >
          {accepting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Accepting...
            </>
          ) : (
            "Accept Agreement"
          )}
        </Button>
      </div>
    </div>
  );
}
