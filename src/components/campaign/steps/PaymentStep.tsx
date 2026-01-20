"use client";

import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { campaignIdAtom } from "@/store/campaign";
import {
    getStripeAmountTableApi,
    createStripeCheckoutSessionApi,
} from "../../../../api/campaigns";

interface MediaPlanItem {
    amount: number;
    booking_month: string;
    insert_program: string;
    quantity: number;
}

interface PaymentDetails {
    campaign_id: string;
    client_name: string;
    date: string;
    media_plan: MediaPlanItem[];
    total_amount: number;
}

interface PaymentStepProps {
    onBack: () => void;
}

export function PaymentStep({ onBack }: PaymentStepProps) {
    const campaignId = useAtomValue(campaignIdAtom);
    const [paymentDetails, setPaymentDetails] =
        useState<PaymentDetails | null>(null);

    const [
        callGetDetails,
        { data: detailsData, loading: loadingDetails },
    ] = useApi({
        errMsg: true,
        cache: "paymentDetails",
        unmount: true,
    });

    const [callCreateCheckoutSession, { loading: creatingSession }] = useApi({
        errMsg: true,
    });

    // Fetch payment details on mount
    useEffect(() => {
        if (campaignId) {
            callGetDetails(getStripeAmountTableApi(campaignId));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    // Process payment details data
    useEffect(() => {
        if (detailsData) {
            const data = detailsData?.data || detailsData;
            setPaymentDetails(data);
        }
    }, [detailsData]);

    const handlePayNow = () => {
        if (!campaignId) {
            toast.error("Campaign ID is missing");
            return;
        }

        callCreateCheckoutSession(
            createStripeCheckoutSessionApi({ campaign_id: campaignId }),
            (response: any) => {
                const redirectUrl = response?.data?.redirect_url || response?.redirect_url;
                if (redirectUrl) {
                    // Redirect to Stripe checkout
                    window.location.href = redirectUrl;
                } else {
                    toast.error("No redirect URL received from payment service");
                }
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
                <span className="ml-4 text-gray-600">Loading payment details...</span>
            </div>
        );
    }

    if (!paymentDetails) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No payment details found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Payment Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment
                </h2>
                <p className="text-gray-600">
                    Review your program details and proceed with payment
                </p>
            </div>

            {/* Program Details Table */}
            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 underline">
                        PROGRAM DETAILS
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
                                {paymentDetails.media_plan.map((item, index) => (
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
                                        {formatCurrency(paymentDetails.total_amount)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between border-t pt-4">
                {/* <Button variant="outline" onClick={onBack} disabled={creatingSession}>
          Back
        </Button> */}
                <div></div>
                <Button
                    onClick={handlePayNow}
                    disabled={creatingSession}
                    className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                >
                    {creatingSession ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Processing...
                        </>
                    ) : (
                        "Pay Now"
                    )}
                </Button>
            </div>
        </div>
    );
}
