"use client";

import {
  fetchActiveModelApi,
  fetchFineTuningJobsApi,
  refreshFineTuningRunningJobsApi,
} from "@/api/admin";
import { FineTuningModals, useFineTuningModals } from "@/components/admin/FineTuningModals";
import type { ActiveModelResponse } from "@/components/admin/FineTuningModals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CircleStop } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "use-hook-api";

type FineTuningStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
type FilterStatus = FineTuningStatus | "all";

interface FineTuningJob {
  status: FineTuningStatus;
  tuned_model_name: string;
  version: string;
  total_records_count?: number;
  train_records_count?: number;
}

const STATUS_OPTIONS: FilterStatus[] = ["all", "queued", "running", "succeeded", "failed", "cancelled"];

function prettyStatus(status: FineTuningStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadgeClass(status: FineTuningStatus) {
  if (status === "succeeded") return "bg-green-100 text-green-700";
  if (status === "running") return "bg-blue-100 text-blue-700";
  if (status === "queued") return "bg-yellow-100 text-yellow-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export default function FineTuningPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const [getActiveModel, { data: activeModelData, loading: activeModelLoading, error: activeModelError }] = useApi({
    cache: "active-model",
  });
  const [getJobs, { data: jobsData, loading: jobsLoading, error: jobsError }] = useApi({
    cache: "fine-tuning-jobs",
  });
  const [refreshRunningJobs, { loading: refreshingStatuses }] = useApi({
    both: true,
    resSuccessMsg: "Fine-tuning jobs status refreshed",
  });

  const getActiveModelRef = useRef(getActiveModel);
  getActiveModelRef.current = getActiveModel;

  const getJobsRef = useRef(getJobs);
  getJobsRef.current = getJobs;

  useEffect(() => {
    getActiveModelRef.current(fetchActiveModelApi());
  }, []);

  useEffect(() => {
    const params = statusFilter === "all" ? undefined : { status: statusFilter };
    getJobsRef.current(fetchFineTuningJobsApi(params));
  }, [statusFilter]);

  const jobs: FineTuningJob[] = useMemo(() => {
    const rawJobs = jobsData?.jobs;
    return Array.isArray(rawJobs) ? rawJobs : [];
  }, [jobsData]);

  const activeModel = activeModelData as ActiveModelResponse | undefined;

  const activeTunedModelName = useMemo(() => {
    if (!activeModel) return null;
    if (activeModel.is_base_model) return null;
    const activeVersion = activeModel.job_version;
    if (!activeVersion) return null;

    return jobs.find((j) => j.version === activeVersion)?.tuned_model_name ?? null;
  }, [activeModel, jobs]);

  const handleRefreshStatuses = () => {
    refreshRunningJobs(refreshFineTuningRunningJobsApi(), () => {
      getJobsRef.current(fetchFineTuningJobsApi(statusFilter === "all" ? undefined : { status: statusFilter }));
    });
  };
  const fineTuningModals = useFineTuningModals({
    activeModel,
    activeTunedModelName,
    onRefreshActiveModel: () => {
      getActiveModelRef.current(fetchActiveModelApi());
    },
    onRefreshJobs: () => {
      getJobsRef.current(fetchFineTuningJobsApi(statusFilter === "all" ? undefined : { status: statusFilter }));
    },
  });

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Fine-Tuning</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={fineTuningModals.openSwitchModal}
            disabled={fineTuningModals.state.switchingModel || fineTuningModals.state.startingFineTuning}
          >
            Switch Model
          </Button>
          <Button
            variant="outline"
            onClick={fineTuningModals.openStartModal}
            disabled={fineTuningModals.state.startingFineTuning || fineTuningModals.state.switchingModel}
          >
            Start New Fine-Tuning Job
          </Button>
          <Button onClick={handleRefreshStatuses} disabled={refreshingStatuses}>
            {refreshingStatuses && <LoadingSpinner size="sm" />}
            <span className={refreshingStatuses ? "ml-2" : ""}>
              {refreshingStatuses ? "Refreshing..." : "Refresh Fine-Tuning Jobs Status"}
            </span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">Active Model</p>
            {activeModelLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <LoadingSpinner size="sm" />
                Loading active model...
              </div>
            ) : activeModelError ? (
              <p className="text-sm text-red-600">Failed to fetch active model.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {activeModel?.active_model || "N/A"}
                </span>
                {activeModel?.job_version && (
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {activeModel.job_version}
                  </span>
                )}
                {activeTunedModelName && (
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {activeTunedModelName}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Fine-Tuning Jobs</h2>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "all" ? "All statuses" : prettyStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Tuned Model Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Total Records Count</th>
                  <th className="px-4 py-3">Train Records Count</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobsLoading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <LoadingSpinner size="sm" />
                        Loading fine-tuning jobs...
                      </div>
                    </td>
                  </tr>
                )}
                {!jobsLoading && jobsError && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-red-600">
                      Failed to load fine-tuning jobs.
                    </td>
                  </tr>
                )}
                {!jobsLoading && !jobsError && jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      No fine-tuning jobs found.
                    </td>
                  </tr>
                )}
                {!jobsLoading &&
                  !jobsError &&
                  jobs.map((job) => (
                    <tr key={job.version} className="border-t">
                      <td
                        className={`px-4 py-3 ${fineTuningModals.clickedJobVersion === job.version ? "bg-primary/5" : ""} cursor-pointer text-primary hover:underline focus:outline-none`}
                        role="button"
                        tabIndex={0}
                        data-clickable="dataset-stats"
                        data-job-version={job.version}
                        onClick={() => fineTuningModals.openDatasetStatsModal(job.version)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            fineTuningModals.openDatasetStatsModal(job.version);
                          }
                        }}
                      >
                        {job.tuned_model_name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(job.status)}`}>
                          {prettyStatus(job.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{job.version}</td>
                      <td className="px-4 py-3">{job.total_records_count ?? "-"}</td>
                      <td className="px-4 py-3">{job.train_records_count ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {job.status === "succeeded" ? (
                          <Button variant="outline" size="sm" onClick={() => fineTuningModals.openTestModal(job.version)}>
                            Test
                          </Button>
                        ) : (job.status === "queued" || job.status === "running") ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                            onClick={() => fineTuningModals.openCancelModal(job.version)}
                            disabled={fineTuningModals.state.cancellingJob}
                          >
                            <CircleStop className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <FineTuningModals controller={fineTuningModals} />
    </main>
  );
}
