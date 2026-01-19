"use client";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { DashboardNavbar } from "@/components/common/DashboardNavbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
    const router = useRouter();

    const handleBackToDashboard = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardNavbar />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <CardContent className="pt-12 pb-12">
                        <div className="flex flex-col items-center justify-center text-center space-y-6">
                            {/* Success Icon */}
                            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </div>

                            {/* Success Message */}
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Payment Successful!
                                </h1>
                                <p className="text-lg text-gray-600">
                                    Your payment has been processed successfully.
                                </p>
                            </div>

                            {/* Additional Information */}
                            <div className="pt-4">
                                <p className="text-sm text-gray-500">
                                    Thank you for your payment. Your campaign is now being processed.
                                </p>
                            </div>

                            {/* Back to Dashboard Button */}
                            <div className="pt-6">
                                <Button
                                    onClick={handleBackToDashboard}
                                    size="lg"
                                    className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                                >
                                    Back To Dashboard
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
