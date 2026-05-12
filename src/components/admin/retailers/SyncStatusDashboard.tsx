"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Clock, RotateCw } from "lucide-react";

interface SyncJobStats {
  sync_job_id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  total_accounts_fetched: number;
  accounts_created: number;
  accounts_deactivated: number;
  total_users_fetched: number;
  users_created: number;
  users_deactivated: number;
  audiences_created: number;
  audiences_deactivated: number;
  total_audiences_fetched: number;
  channels_created: number;
  channels_deactivated: number;
  total_channels_fetched: number;
  created_at: string;
  updated_at: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusIcon(status: SyncJobStats["status"]) {
  if (status === "completed") return <CheckCircle2 className="text-green-600" size={20} />;
  if (status === "failed") return <XCircle className="text-red-600" size={20} />;
  return <Clock className="text-blue-600" size={20} />;
}

function getStatusColor(status: SyncJobStats["status"]) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "failed") return "bg-red-100 text-red-800";
  if (status === "in_progress") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-800";
}

export function SyncStatusDashboard({
  stats,
  syncJobId,
  onRefresh,
  isRefreshing,
}: {
  stats: SyncJobStats | null;
  syncJobId: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6 text-gray-500">
            No sync data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActive = stats.status === "pending" || stats.status === "in_progress" || stats.status === "failed";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Latest Sync Status</h3>
              <p className="text-sm text-gray-600">
                Last updated: {formatDate(stats.updated_at)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(stats.status)}
                <Badge className={getStatusColor(stats.status)}>
                  {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
                </Badge>
              </div>
              {isActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-900 text-white text-xs">
                      {isRefreshing ? "Refreshing..." : stats.status === "failed" ? "Retry sync status" : "Refresh sync status"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Accounts Fetched
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_accounts_fetched}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                Accounts Created
              </p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {stats.accounts_created}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                Accounts Deactivated
              </p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {stats.accounts_deactivated}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Users Fetched
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_users_fetched}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                Users Created
              </p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {stats.users_created}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                Users Deactivated
              </p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {stats.users_deactivated}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Audiences Fetched
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_audiences_fetched}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                Audiences Created
              </p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {stats.audiences_created}
              </p>
            </div>

            <div className="bg-pink-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide">
                Audiences Deactivated
              </p>
              <p className="text-2xl font-bold text-pink-900 mt-1">
                {stats.audiences_deactivated}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Channels Fetched
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_channels_fetched}
              </p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                Channels Created
              </p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">
                {stats.channels_created}
              </p>
            </div>

            <div className="bg-rose-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
                Channels Deactivated
              </p>
              <p className="text-2xl font-bold text-rose-900 mt-1">
                {stats.channels_deactivated}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
