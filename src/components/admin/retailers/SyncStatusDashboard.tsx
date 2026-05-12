"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type ColorType = "fetched" | "created" | "inactive";

const colorMap: Record<ColorType, { bg: string; border: string; text: string; icon: string }> = {
  fetched: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    icon: "text-slate-500",
  },
  created: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-500",
  },
  inactive: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    icon: "text-rose-500",
  },
};

function MetricGroup({
  label,
  metrics,
}: {
  label: string;
  metrics: Array<{ label: string; value: number; color: ColorType }>;
}) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3 space-y-2">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</h4>
      <div className="space-y-1.5">
        {metrics.map((metric) => {
          const colors = colorMap[metric.color];
          return (
            <div key={metric.label} className={`${colors.bg} border ${colors.border} rounded-md px-3 py-2 transition-all hover:shadow-sm`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-600">{metric.label}</span>
                <span className={`text-lg font-bold ${colors.text}`}>{metric.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SyncStatusDashboard({
  stats,
  onRefresh,
  isRefreshing,
}: {
  stats: SyncJobStats | null;
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
    <Card className="border-0 shadow-sm">
      <CardContent className="pt-4 pb-4 px-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.status)}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Sync Status</h3>
                <p className="text-xs text-gray-500">Updated {formatDate(stats.updated_at)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(stats.status)}>
              {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
            </Badge>
            {isActive && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-500 hover:text-blue-600"
                    >
                      <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="bg-gray-900 text-white text-xs">
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Accounts */}
          <MetricGroup label="Accounts" metrics={[
            { label: "Fetched", value: stats.total_accounts_fetched, color: "fetched" },
            { label: "Created", value: stats.accounts_created, color: "created" },
            { label: "Inactive", value: stats.accounts_deactivated, color: "inactive" },
          ]} />

          {/* Users */}
          <MetricGroup label="Users" metrics={[
            { label: "Fetched", value: stats.total_users_fetched, color: "fetched" },
            { label: "Created", value: stats.users_created, color: "created" },
            { label: "Inactive", value: stats.users_deactivated, color: "inactive" },
          ]} />

          {/* Audiences */}
          <MetricGroup label="Audiences" metrics={[
            { label: "Fetched", value: stats.total_audiences_fetched, color: "fetched" },
            { label: "Created", value: stats.audiences_created, color: "created" },
            { label: "Inactive", value: stats.audiences_deactivated, color: "inactive" },
          ]} />

          {/* Channels */}
          <MetricGroup label="Channels" metrics={[
            { label: "Fetched", value: stats.total_channels_fetched, color: "fetched" },
            { label: "Created", value: stats.channels_created, color: "created" },
            { label: "Inactive", value: stats.channels_deactivated, color: "inactive" },
          ]} />
        </div>
      </CardContent>
    </Card>
  );
}
