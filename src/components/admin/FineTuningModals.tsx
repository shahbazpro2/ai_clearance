"use client";

import {
    cancelFineTuningJobApi,
    fetchFineTuningDatasetStatsApi,
    fetchFineTuningJobsApi,
    startModelFineTuningApi,
    switchActiveModelApi,
    testFineTunedModelApi,
} from "@/api/admin";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { useApi } from "use-hook-api";

type FineTuningJobStatus =
    | "queued"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled";

export interface ActiveModelResponse {
    active_model: string;
    base_model: string;
    is_base_model: boolean;
    job_version?: string | null;
    source?: string;
}

interface FineTuningJob {
    status: FineTuningJobStatus;
    tuned_model_name: string;
    version: string;
}

interface FineTuningDatasetStatsResponse {
    job_details: {
        base_model?: string;
        created_at?: string;
        dataset_version?: string;
        prepared_dataset_gcs_uri?: string;
        provider?: string;
        status?: string;
        test_records_count?: number;
        total_records_count?: number;
        train_records_count?: number;
        tuned_model_link?: string;
        tuned_model_name?: string;
        updated_at?: string;
        version?: string;
    };
}

function useModalState<T>() {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const openWith = (payload: T) => {
        setData(payload);
        setOpen(true);
    };

    const close = () => {
        setOpen(false);
        setData(null);
    };

    const onOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) setData(null);
    };

    return { open, data, openWith, close, onOpenChange, setData, setOpen };
}

export function useFineTuningModals({
    activeModel,
    activeTunedModelName,
    onRefreshActiveModel,
    onRefreshJobs,
}: {
    activeModel?: ActiveModelResponse;
    activeTunedModelName: string | null;
    onRefreshActiveModel: () => void;
    onRefreshJobs: () => void;
}) {
    const switchModal = useModalState<true>();
    const startModal = useModalState<true>();
    const testModal = useModalState<{ jobVersion: string }>();
    const cancelModal = useModalState<{ jobVersion: string }>();
    const datasetStatsModal = useModalState<{ jobVersion: string }>();

    const [useBaseModel, setUseBaseModel] = useState(true);
    const [selectedJobVersion, setSelectedJobVersion] = useState<string>("");
    const [tunedModelDisplayName, setTunedModelDisplayName] = useState("");

    const [testFile, setTestFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [clickedJobVersion, setClickedJobVersion] = useState<string>("");

    const [getSucceededJobs, { data: succeededJobsData, loading: succeededJobsLoading }] =
        useApi({
            cache: "fine-tuning-succeeded-jobs",
        });

    const succeededJobs: FineTuningJob[] = Array.isArray(succeededJobsData?.jobs)
        ? succeededJobsData.jobs
        : [];

    const [switchModel, { loading: switchingModel }] = useApi({
        both: true,
        resSuccessMsg: "Model switched successfully",
    });
    const [startFineTuning, { loading: startingFineTuning }] = useApi({
        both: true,
        resSuccessMsg: "Fine-tuning job queued successfully",
    });
    const [testModel, { data: testResponseData, loading: testingModel, error: testModelError }] =
        useApi({
            both: true,
            resSuccessMsg: "Model tested successfully",
        });
    const [cancelJob, { loading: cancellingJob }] = useApi({
        both: true,
        resSuccessMsg: "Fine-tuning job cancellation requested successfully",
    });
    const [getDatasetStats, { data: datasetStatsData, loading: datasetStatsLoading, error: datasetStatsError }] =
        useApi({
            errMsg: false,
        });

    const openSwitchModal = () => {
        setUseBaseModel(true);
        setSelectedJobVersion("");
        switchModal.openWith(true);
        getSucceededJobs(fetchFineTuningJobsApi({ status: "succeeded" }));
    };

    const openStartModal = () => {
        startModal.openWith(true);
    };

    const openTestModal = (jobVersion: string) => {
        setTestFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        testModal.openWith({ jobVersion });
    };

    const openCancelModal = (jobVersion: string) => {
        cancelModal.openWith({ jobVersion });
    };

    const openDatasetStatsModal = (jobVersion: string) => {
        setClickedJobVersion(jobVersion);
        datasetStatsModal.openWith({ jobVersion });
        getDatasetStats(fetchFineTuningDatasetStatsApi(jobVersion));
    };

    const handleSwitchModel = () => {
        const payload = useBaseModel
            ? { use_base_model: true }
            : { use_base_model: false, job_version: selectedJobVersion };
        if (!useBaseModel && !selectedJobVersion) return;
        switchModel(switchActiveModelApi(payload), () => {
            switchModal.close();
            onRefreshActiveModel();
        });
    };

    const handleStartFineTuning = () => {
        const name = tunedModelDisplayName.trim();
        const payload = name ? { tuned_model_display_name: name } : undefined;
        startFineTuning(startModelFineTuningApi(payload), () => {
            startModal.close();
            setTunedModelDisplayName("");
            onRefreshJobs();
        });
    };

    const handleRunTest = () => {
        if (!testModal.data?.jobVersion || !testFile) return;
        const formData = new FormData();
        formData.append("job_version", testModal.data.jobVersion);
        formData.append("file", testFile);
        testModel(testFineTunedModelApi(formData), () => { });
    };

    const confirmCancelJob = () => {
        if (!cancelModal.data?.jobVersion) return;
        cancelJob(cancelFineTuningJobApi({ job_version: cancelModal.data.jobVersion }), () => {
            cancelModal.close();
            onRefreshJobs();
        });
    };

    useEffect(() => {
        if (!datasetStatsModal.open) {
            setClickedJobVersion("");
        }
    }, [datasetStatsModal.open]);

    const datasetStats = datasetStatsData as FineTuningDatasetStatsResponse | undefined;
    const jobDetails = datasetStats?.job_details;
    const testResult = testResponseData;

    return {
        openSwitchModal,
        openStartModal,
        openTestModal,
        openCancelModal,
        openDatasetStatsModal,
        clickedJobVersion,
        state: {
            activeModel,
            activeTunedModelName,
            switchModal,
            startModal,
            testModal,
            cancelModal,
            datasetStatsModal,
            useBaseModel,
            setUseBaseModel,
            selectedJobVersion,
            setSelectedJobVersion,
            tunedModelDisplayName,
            setTunedModelDisplayName,
            testFile,
            setTestFile,
            fileInputRef,
            succeededJobs,
            succeededJobsLoading,
            switchingModel,
            startingFineTuning,
            testingModel,
            testModelError,
            testResult,
            cancellingJob,
            datasetStatsLoading,
            datasetStatsError,
            datasetStatsModalJobVersion: datasetStatsModal.data?.jobVersion || "",
            jobDetails,
        },
        actions: {
            handleSwitchModel,
            handleStartFineTuning,
            handleRunTest,
            confirmCancelJob,
        },
    };
}

type FineTuningModalsController = ReturnType<typeof useFineTuningModals>;
type FineTuningModalsState = FineTuningModalsController["state"];
type FineTuningModalsActions = FineTuningModalsController["actions"];

export function SwitchModelModal({
    state,
    actions,
}: {
    state: FineTuningModalsState;
    actions: FineTuningModalsActions;
}) {
    return (
        <Dialog open={state.switchModal.open} onOpenChange={state.switchModal.onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Switch Active Model</DialogTitle>
                    <DialogDescription>Choose base model or a succeeded fine-tuned job version.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="rounded-md border bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600">Currently Active</p>
                        {state.activeModel?.is_base_model ? (
                            <p className="text-sm font-semibold text-gray-900">Base Model</p>
                        ) : state.activeTunedModelName ? (
                            <p className="text-sm font-semibold text-gray-900">
                                {state.activeTunedModelName}{" "}
                                {state.activeModel?.job_version ? `(${state.activeModel.job_version})` : ""}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-gray-700">Fine-tuned model</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="use-base-model"
                            checked={state.useBaseModel}
                            onCheckedChange={(checked) => state.setUseBaseModel(checked === true)}
                            disabled={state.switchingModel}
                        />
                        <label htmlFor="use-base-model" className="text-sm font-medium">
                            Switch to Base Model
                        </label>
                    </div>
                    {!state.useBaseModel && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Select job version</p>
                            <Select value={state.selectedJobVersion} onValueChange={state.setSelectedJobVersion}>
                                <SelectTrigger disabled={state.switchingModel}>
                                    <SelectValue placeholder="Select version" />
                                </SelectTrigger>
                                <SelectContent>
                                    {state.succeededJobs.map((job) => (
                                        <SelectItem key={job.version} value={job.version}>
                                            {job.version} ({job.tuned_model_name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {state.succeededJobsLoading && (
                                <p className="text-xs text-gray-500">Loading succeeded job versions...</p>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={state.switchModal.close} disabled={state.switchingModel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={actions.handleSwitchModel}
                        disabled={state.switchingModel || (!state.useBaseModel && !state.selectedJobVersion)}
                    >
                        {state.switchingModel && <LoadingSpinner size="sm" />}
                        <span className={state.switchingModel ? "ml-2" : ""}>
                            {state.switchingModel ? "Switching..." : "Switch"}
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function StartFineTuningModal({
    state,
    actions,
}: {
    state: FineTuningModalsState;
    actions: FineTuningModalsActions;
}) {
    return (
        <Dialog open={state.startModal.open} onOpenChange={state.startModal.onOpenChange}>
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
                        value={state.tunedModelDisplayName}
                        onChange={(event) => state.setTunedModelDisplayName(event.target.value)}
                        placeholder="e.g. home-products-v18"
                        disabled={state.startingFineTuning}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={state.startModal.close} disabled={state.startingFineTuning}>
                        Cancel
                    </Button>
                    <Button onClick={actions.handleStartFineTuning} disabled={state.startingFineTuning}>
                        {state.startingFineTuning && <LoadingSpinner size="sm" />}
                        <span className={state.startingFineTuning ? "ml-2" : ""}>
                            {state.startingFineTuning ? "Starting..." : "Start Model Fine-Tuning"}
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function TestModelModal({
    state,
    actions,
}: {
    state: FineTuningModalsState;
    actions: FineTuningModalsActions;
}) {
    return (
        <Dialog open={state.testModal.open} onOpenChange={state.testModal.onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Test Fine-Tuned Model</DialogTitle>
                    <DialogDescription>
                        Upload an insert sample file and classify it using {state.testModal.data?.jobVersion || "the selected"}{" "}
                        version.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Upload Insert Sample File</p>
                        <Input
                            ref={state.fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                            onChange={(event) => state.setTestFile(event.target.files?.[0] || null)}
                            disabled={state.testingModel}
                        />
                    </div>
                    <Button
                        onClick={actions.handleRunTest}
                        disabled={state.testingModel || !state.testFile || !state.testModal.data?.jobVersion}
                    >
                        {state.testingModel && <LoadingSpinner size="sm" />}
                        <span className={state.testingModel ? "ml-2" : ""}>
                            {state.testingModel ? "Classifying..." : "Classify Category"}
                        </span>
                    </Button>
                    {state.testingModel && !state.testResult && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <LoadingSpinner size="sm" />
                            Calling classification API...
                        </div>
                    )}
                    {state.testModelError && <p className="text-sm text-red-600">Failed to classify the uploaded file.</p>}
                    {state.testResult && (
                        <div className="rounded-lg border p-3 text-sm space-y-1 bg-gray-50">
                            <p>
                                <span className="font-semibold">Job Version:</span> {state.testResult?.job_version || "-"}
                            </p>
                            <p>
                                <span className="font-semibold">Tuned Model:</span> {state.testResult?.tuned_model_name || "-"}
                            </p>
                            <p>
                                <span className="font-semibold">Predicted Category:</span> {state.testResult?.predicted_category || "-"}
                            </p>
                            <p>
                                <span className="font-semibold">Predicted Category ID:</span>{" "}
                                {state.testResult?.predicted_category_id || "-"}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function CancelFineTuningJobModal({
    state,
    actions,
}: {
    state: FineTuningModalsState;
    actions: FineTuningModalsActions;
}) {
    return (
        <Dialog open={state.cancelModal.open} onOpenChange={state.cancelModal.onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel Fine-Tuning Job</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel the fine-tuning job {state.cancelModal.data?.jobVersion}? This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={state.cancelModal.close} disabled={state.cancellingJob}>
                        No, keep it
                    </Button>
                    <Button variant="destructive" onClick={actions.confirmCancelJob} disabled={state.cancellingJob}>
                        {state.cancellingJob && <LoadingSpinner size="sm" />}
                        <span className={state.cancellingJob ? "ml-2" : ""}>
                            {state.cancellingJob ? "Cancelling..." : "Yes, cancel job"}
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DatasetStatsModal({ state }: { state: FineTuningModalsState }) {
    return (
        <Dialog open={state.datasetStatsModal.open} onOpenChange={state.datasetStatsModal.onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Dataset Stats</DialogTitle>
                    <DialogDescription>
                        {state.datasetStatsModalJobVersion ? `Job version: ${state.datasetStatsModalJobVersion}` : "Dataset statistics"}
                    </DialogDescription>
                </DialogHeader>
                {state.datasetStatsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <LoadingSpinner size="sm" />
                        Loading dataset stats...
                    </div>
                ) : state.datasetStatsError ? (
                    <p className="text-sm text-red-600">Failed to load dataset stats.</p>
                ) : (
                    <div className="rounded-lg border p-4 bg-gray-50 text-sm space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <span className="font-semibold">Base Model:</span> {state.jobDetails?.base_model || "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Provider:</span> {state.jobDetails?.provider || "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Status:</span> {state.jobDetails?.status || "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Version:</span>{" "}
                                {state.jobDetails?.version ||
                                    state.jobDetails?.dataset_version ||
                                    state.datasetStatsModalJobVersion ||
                                    "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Total Records:</span> {state.jobDetails?.total_records_count ?? "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Train Records:</span> {state.jobDetails?.train_records_count ?? "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Test Records:</span> {state.jobDetails?.test_records_count ?? "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Tuned Model Name:</span> {state.jobDetails?.tuned_model_name || "-"}
                            </div>
                        </div>
                        <div>
                            <span className="font-semibold">Prepared Dataset GCS URI:</span>{" "}
                            <span className="break-all">{state.jobDetails?.prepared_dataset_gcs_uri || "-"}</span>
                        </div>
                        <div>
                            <span className="font-semibold">Tuned Model Link:</span>{" "}
                            <span className="break-all">{state.jobDetails?.tuned_model_link || "-"}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <span className="font-semibold">Created At:</span> {state.jobDetails?.created_at || "-"}
                            </div>
                            <div>
                                <span className="font-semibold">Updated At:</span> {state.jobDetails?.updated_at || "-"}
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={state.datasetStatsModal.close}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function FineTuningModals({
    controller,
}: {
    controller: ReturnType<typeof useFineTuningModals>;
}) {
    const { state, actions } = controller;

    return (
        <>
            <SwitchModelModal state={state} actions={actions} />
            <StartFineTuningModal state={state} actions={actions} />
            <TestModelModal state={state} actions={actions} />
            <CancelFineTuningJobModal state={state} actions={actions} />
            <DatasetStatsModal state={state} />
        </>
    );
}
