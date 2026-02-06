"use client";

import ChallengedReviewsSection from "@/components/admin/manualReviews/ChallengedReviewsSection";
import UnchallengedReviewsSection from "@/components/admin/manualReviews/UnChallengedReviewSection";
import { useState } from "react";



export default function ManualReviewsPage() {
    const [activeTab, setActiveTab] = useState<"challenged" | "unchallenged">("challenged");

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold">Manual Reviews</h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("challenged")}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "challenged"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Challenged Records
                    </button>
                    <button
                        onClick={() => setActiveTab("unchallenged")}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === "unchallenged"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        Unchallenged Records
                    </button>
                </nav>
            </div>
            {activeTab === "challenged" ? (
                <ChallengedReviewsSection />
            ) : (
                <UnchallengedReviewsSection />
            )}
        </main>
    );
}
