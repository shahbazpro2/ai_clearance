"use client";

import {
  fetchActiveModelApi,
  fetchFineTuningJobsApi,
  refreshFineTuningRunningJobsApi,
  startModelFineTuningApi,
  switchActiveModelApi,
  testFineTunedModelApi,
} from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "use-hook-api";

type FineTuningStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
type FilterStatus = FineTuningStatus | "all";

interface ActiveModelResponse {
  active_model: string;
  base_model: string;
  is_base_model: boolean;
  job_version?: string | null;
  source?: string;
}

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
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [useBaseModel, setUseBaseModel] = useState(true);
  const [selectedJobVersion, setSelectedJobVersion] = useState<string>("");
  const [tunedModelDisplayName, setTunedModelDisplayName] = useState("");
  const [testingJobVersion, setTestingJobVersion] = useState<string>("");
  const [testFile, setTestFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [getActiveModel, { data: activeModelData, loading: activeModelLoading, error: activeModelError }] = useApi({
    cache: "active-model",
  });
  const [getJobs, { data: jobsData, loading: jobsLoading, error: jobsError }] = useApi({
    cache: "fine-tuning-jobs",
  });
  const [getSucceededJobs, { data: succeededJobsData, loading: succeededJobsLoading }] = useApi({
    cache: "fine-tuning-succeeded-jobs",
  });

  const [switchModel, { loading: switchingModel }] = useApi({
    both: true,
    resSuccessMsg: "Model switched successfully",
  });
  const [startFineTuning, { loading: startingFineTuning }] = useApi({
    both: true,
    resSuccessMsg: "Fine-tuning job queued successfully",
  });
  const [refreshRunningJobs, { loading: refreshingStatuses }] = useApi({
    both: true,
    resSuccessMsg: "Fine-tuning jobs status refreshed",
  });
  const [testModel, { data: testResponseData, loading: testingModel, error: testModelError }] = useApi({
    both: true,
    resSuccessMsg: "Model tested successfully",
  });

  const getActiveModelRef = useRef(getActiveModel);
  getActiveModelRef.current = getActiveModel;

  const getJobsRef = useRef(getJobs);
  getJobsRef.current = getJobs;

  const getSucceededJobsRef = useRef(getSucceededJobs);
  getSucceededJobsRef.current = getSucceededJobs;

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

  const succeededJobs: FineTuningJob[] = useMemo(() => {
    const rawJobs = succeededJobsData?.jobs;
    return Array.isArray(rawJobs) ? rawJobs : [];
  }, [succeededJobsData]);

  const activeModel = activeModelData as ActiveModelResponse | undefined;

  const activeTunedModelName = useMemo(() => {
    if (!activeModel) return null;
    if (activeModel.is_base_model) return null;
    const activeVersion = activeModel.job_version;
    if (!activeVersion) return null;

    return jobs.find((j) => j.version === activeVersion)?.tuned_model_name ?? null;
  }, [activeModel, jobs]);

  const handleOpenSwitchModal = () => {
    setUseBaseModel(true);
    setSelectedJobVersion("");
    setSwitchModalOpen(true);
    getSucceededJobsRef.current(fetchFineTuningJobsApi({ status: "succeeded" }));
  };

  const handleSwitchModel = () => {
    const payload = useBaseModel
      ? { use_base_model: true }
      : { use_base_model: false, job_version: selectedJobVersion };
    if (!useBaseModel && !selectedJobVersion) {
      return;
    }
    switchModel(switchActiveModelApi(payload), () => {
      setSwitchModalOpen(false);
      getActiveModelRef.current(fetchActiveModelApi());
    });
  };

  const handleStartFineTuning = () => {
    const name = tunedModelDisplayName.trim();
    const payload = name ? { tuned_model_display_name: name } : undefined;
    startFineTuning(startModelFineTuningApi(payload), () => {
      setStartModalOpen(false);
      setTunedModelDisplayName("");
      getJobsRef.current(fetchFineTuningJobsApi(statusFilter === "all" ? undefined : { status: statusFilter }));
    });
  };

  const handleRefreshStatuses = () => {
    refreshRunningJobs(refreshFineTuningRunningJobsApi(), () => {
      getJobsRef.current(fetchFineTuningJobsApi(statusFilter === "all" ? undefined : { status: statusFilter }));
    });
  };

  const openTestModal = (jobVersion: string) => {
    setTestingJobVersion(jobVersion);
    setTestFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setTestModalOpen(true);
  };

  const handleRunTest = () => {
    if (!testingJobVersion || !testFile) return;
    const formData = new FormData();
    formData.append("job_version", testingJobVersion);
    formData.append("file", testFile);
    // Provide an explicit callback so the hook lifecycle reliably toggles `loading`.
    testModel(testFineTunedModelApi(formData), () => {});
  };

  const testResult = testResponseData;

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Fine-Tuning</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleOpenSwitchModal}
            disabled={switchingModel || startingFineTuning}
          >
            Switch Model
          </Button>
          <Button
            variant="outline"
            onClick={() => setStartModalOpen(true)}
            disabled={startingFineTuning || switchingModel}
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
                  <th className="px-4 py-3">Test Model</th>
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
                      <td className="px-4 py-3">{job.tuned_model_name || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(job.status)}`}>
                          {prettyStatus(job.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{job.version}</td>
                      <td className="px-4 py-3">{job.total_records_count ?? "-"}</td>
                      <td className="px-4 py-3">{job.train_records_count ?? "-"}</td>
                      <td className="px-4 py-3">
                        {job.status === "succeeded" ? (
                          <Button variant="outline" size="sm" onClick={() => openTestModal(job.version)}>
                            Test
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

      <Dialog open={switchModalOpen} onOpenChange={setSwitchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Active Model</DialogTitle>
            <DialogDescription>Choose base model or a succeeded fine-tuned job version.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-600">Currently Active</p>
              {activeModel?.is_base_model ? (
                <p className="text-sm font-semibold text-gray-900">Base Model</p>
              ) : activeTunedModelName ? (
                <p className="text-sm font-semibold text-gray-900">
                  {activeTunedModelName} {activeModel?.job_version ? `(${activeModel.job_version})` : ""}
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-700">Fine-tuned model</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-base-model"
                checked={useBaseModel}
                onCheckedChange={(checked) => setUseBaseModel(checked === true)}
                disabled={switchingModel}
              />
              <label htmlFor="use-base-model" className="text-sm font-medium">
                Switch to Base Model
              </label>
            </div>
            {!useBaseModel && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Select job version</p>
                <Select value={selectedJobVersion} onValueChange={setSelectedJobVersion}>
                  <SelectTrigger disabled={switchingModel}>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {succeededJobs.map((job) => (
                      <SelectItem key={job.version} value={job.version}>
                        {job.version} ({job.tuned_model_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {succeededJobsLoading && (
                  <p className="text-xs text-gray-500">Loading succeeded job versions...</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSwitchModalOpen(false)}
              disabled={switchingModel}
            >
              Cancel
            </Button>
            <Button onClick={handleSwitchModel} disabled={switchingModel || (!useBaseModel && !selectedJobVersion)}>
              {switchingModel && <LoadingSpinner size="sm" />}
              <span className={switchingModel ? "ml-2" : ""}>{switchingModel ? "Switching..." : "Switch"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={startModalOpen} onOpenChange={setStartModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Fine-Tuning Job</DialogTitle>
            <DialogDescription>Optionally provide a tuned model display name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="tuned-model-display-name" className="text-sm font-medium">
              Tuned Model Name (Optional)
            </label>
            <Input
              id="tuned-model-display-name"
              value={tunedModelDisplayName}
              onChange={(event) => setTunedModelDisplayName(event.target.value)}
              placeholder="e.g. home-products-v18"
              disabled={startingFineTuning}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStartModalOpen(false)}
              disabled={startingFineTuning}
            >
              Cancel
            </Button>
            <Button onClick={handleStartFineTuning} disabled={startingFineTuning}>
              {startingFineTuning && <LoadingSpinner size="sm" />}
              <span className={startingFineTuning ? "ml-2" : ""}>
                {startingFineTuning ? "Starting..." : "Start Model Fine-Tuning"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Test Fine-Tuned Model</DialogTitle>
            <DialogDescription>
              Upload an insert sample file and classify it using {testingJobVersion || "the selected"} version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload Insert Sample File</p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                onChange={(event) => setTestFile(event.target.files?.[0] || null)}
                disabled={testingModel}
              />
            </div>
            <Button onClick={handleRunTest} disabled={testingModel || !testFile || !testingJobVersion}>
              {testingModel && <LoadingSpinner size="sm" />}
              <span className={testingModel ? "ml-2" : ""}>{testingModel ? "Classifying..." : "Classify Category"}</span>
            </Button>
            {testingModel && !testResult && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <LoadingSpinner size="sm" />
                Calling classification API...
              </div>
            )}
            {testModelError && (
              <p className="text-sm text-red-600">Failed to classify the uploaded file.</p>
            )}
            {testResult && (
              <div className="rounded-lg border p-3 text-sm space-y-1 bg-gray-50">
                <p>
                  <span className="font-semibold">Job Version:</span> {testResult?.job_version || "-"}
                </p>
                <p>
                  <span className="font-semibold">Tuned Model:</span> {testResult?.tuned_model_name || "-"}
                </p>
                <p>
                  <span className="font-semibold">Predicted Category:</span> {testResult?.predicted_category || "-"}
                </p>
                <p>
                  <span className="font-semibold">Predicted Category ID:</span> {testResult?.predicted_category_id || "-"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
