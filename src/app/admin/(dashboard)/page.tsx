"use client";

import { useEffect } from "react";
import { useApi } from "use-hook-api";
import { fetchHomePageDetailsApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
    const [getDetails, { data, loading, error }] = useApi({});

    useEffect(() => {
        getDetails(fetchHomePageDetailsApi());
    }, [getDetails]);

    const stats = data?.manual_review_counts || { done: 0, pending: 0, total_count: 0 };
    const availabilityStats = data?.manual_availability_review_counts || { done: 0, pending: 0, total_count: 0 };
    // Calculate percentages safely
    const total = stats.total_count || 1; // Avoid division by zero for display
    const donePercentage = (stats.done / total) * 100;
    const pendingPercentage = (stats.pending / total) * 100;
    const availabilityTotal = availabilityStats.total_count || 1;
    const availabilityDonePct = (availabilityStats.done / availabilityTotal) * 100;
    const availabilityPendingPct = (availabilityStats.pending / availabilityTotal) * 100;

    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-lg font-bold mb-6">Dashboard</h1>

            {loading && <div className="text-center py-4">Loading stats...</div>}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    Error loading dashboard details.
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                    <CardContent className="p-0 flex flex-col sm:flex-row sm:min-h-[100px]">
                        <div className="flex-1 p-6">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Reviews</p>
                            <p className="text-sm font-medium mt-1">Total Records</p>
                            <div className="text-xl font-bold mt-2 text-primary">{stats.total_count}</div>
                        </div>
                        <Separator orientation="vertical" className="sm:block hidden h-auto self-stretch" />
                        <Separator orientation="horizontal" className="sm:hidden" />
                        <div className="flex-1 p-6">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Availability</p>
                            <p className="text-sm font-medium mt-1">Total</p>
                            <div className="text-xl font-bold mt-2 text-primary">{availabilityStats.total_count}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0 flex flex-col sm:flex-row sm:min-h-[100px]">
                        <div className="flex-1 p-6">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Reviews</p>
                            <p className="text-sm font-medium mt-1">Pending</p>
                            <div className="text-xl font-bold mt-2 text-primary">{stats.pending}</div>
                            <Progress value={pendingPercentage} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">{pendingPercentage.toFixed(1)}% of total</p>
                        </div>
                        <Separator orientation="vertical" className="sm:block hidden h-auto self-stretch" />
                        <Separator orientation="horizontal" className="sm:hidden" />
                        <div className="flex-1 p-6">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Availability</p>
                            <p className="text-sm font-medium mt-1">Pending</p>
                            <div className="text-xl font-bold mt-2 text-primary">{availabilityStats.pending}</div>
                            <Progress value={availabilityPendingPct} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">{availabilityPendingPct.toFixed(1)}% of total</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-0 flex flex-col sm:flex-row sm:min-h-[100px]">
                        <div className="flex-1 p-6">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Reviews</p>
                            <p className="text-sm font-medium mt-1">Completed</p>
                            <div className="text-xl font-bold mt-2 text-primary">{stats.done}</div>
                            <Progress value={donePercentage} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">{donePercentage.toFixed(1)}% of total</p>
                        </div>
                        <Separator orientation="vertical" className="sm:block hidden h-auto self-stretch" />
                        <Separator orientation="horizontal" className="sm:hidden" />
                        <div className="flex-1 p-6">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual Availability</p>
                            <p className="text-sm font-medium mt-1">Done</p>
                            <div className="text-xl font-bold mt-2 text-primary">{availabilityStats.done}</div>
                            <Progress value={availabilityDonePct} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-1">{availabilityDonePct.toFixed(1)}% of total</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Review Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span>Completed</span>
                                    <span>{stats.done}</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${donePercentage}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span>Pending</span>
                                    <span>{stats.pending}</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${pendingPercentage}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Manual Reviews Graph</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {total === 0 ? (
                            <div className="text-sm text-muted-foreground">No data available</div>
                        ) : (
                            <div className="w-full">
                                <div className="flex items-end justify-center gap-8 h-44">
                                    {[
                                        { label: "Completed", value: stats.done, color: "bg-green-500" },
                                        { label: "Pending", value: stats.pending, color: "bg-yellow-500" },
                                    ].map((item) => {
                                        const maxValue = Math.max(stats.done, stats.pending, 1);
                                        const height = Math.round((item.value / maxValue) * 160);
                                        const percent = Math.round((item.value / total) * 100);
                                        return (
                                            <div key={item.label} className="flex flex-col items-center">
                                                <div className="text-xs font-medium mb-2">{item.value}</div>
                                                <div
                                                    className={`w-12 ${item.color} rounded-t-md transition-all duration-500`}
                                                    style={{ height }}
                                                    aria-label={`${item.label} ${percent}%`}
                                                />
                                                <div className="text-xs text-muted-foreground mt-2">{item.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 flex justify-center gap-8 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                                        <span>Completed ({Math.round((stats.done / total) * 100)}%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 rounded-sm bg-yellow-500" />
                                        <span>Pending ({Math.round((stats.pending / total) * 100)}%)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Manual Availability Review Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span>Completed</span>
                                    <span>{availabilityStats.done}</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${availabilityDonePct}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1 text-sm">
                                    <span>Pending</span>
                                    <span>{availabilityStats.pending}</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-yellow-500 h-full transition-all duration-500" style={{ width: `${availabilityPendingPct}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Manual Availability Graph</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {availabilityStats.total_count === 0 ? (
                            <div className="text-sm text-muted-foreground">No data available</div>
                        ) : (
                            <div className="w-full">
                                <div className="flex items-end justify-center gap-8 h-44">
                                    {[
                                        { label: "Completed", value: availabilityStats.done, color: "bg-green-500" },
                                        { label: "Pending", value: availabilityStats.pending, color: "bg-yellow-500" },
                                    ].map((item) => {
                                        const maxValue = Math.max(availabilityStats.done, availabilityStats.pending, 1);
                                        const height = Math.round((item.value / maxValue) * 160);
                                        const percent = Math.round((item.value / availabilityTotal) * 100);
                                        return (
                                            <div key={item.label} className="flex flex-col items-center">
                                                <div className="text-xs font-medium mb-2">{item.value}</div>
                                                <div
                                                    className={`w-12 ${item.color} rounded-t-md transition-all duration-500`}
                                                    style={{ height }}
                                                    aria-label={`${item.label} ${percent}%`}
                                                />
                                                <div className="text-xs text-muted-foreground mt-2">{item.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 flex justify-center gap-8 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
                                        <span>Completed ({Math.round(availabilityDonePct)}%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 rounded-sm bg-yellow-500" />
                                        <span>Pending ({Math.round(availabilityPendingPct)}%)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
