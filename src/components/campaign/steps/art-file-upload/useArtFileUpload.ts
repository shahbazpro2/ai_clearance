import { useState, useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import { campaignIdAtom } from "@/store/campaign";
import {
  getArtFilesDetailsApi,
  uploadArtFilesApi,
} from "../../../../../api/campaigns";
import { ArtFilesDetails, FileUploadState, Program, Month } from "./types";

export function useArtFileUpload() {
  const campaignId = useAtomValue(campaignIdAtom);
  const [artFilesDetails, setArtFilesDetails] =
    useState<ArtFilesDetails | null>(null);
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const [
    callGetArtFilesDetails,
    { data: artFilesDetailsData, loading: loadingDetails, refetch },
  ] = useApi({
    errMsg: true,
    cache: "artfilesdetails",
    unmount: true,
  });

  const [callUploadArtFiles, { loading: uploading }] = useApi({
    both: true,
    resSuccessMsg: "Files uploaded successfully",
  });

  // Fetch art file details on mount
  useEffect(() => {
    if (campaignId) {
      callGetArtFilesDetails(getArtFilesDetailsApi(campaignId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Process art files details data
  useEffect(() => {
    if (artFilesDetailsData) {
      const data = artFilesDetailsData?.data || artFilesDetailsData;
      setArtFilesDetails(data);

      // Initialize file upload state
      const initialState: FileUploadState = {};
      data.programs?.forEach((program: Program) => {
        initialState[program.id] = {};
        program.months?.forEach((month: Month) => {
          initialState[program.id][month.month_number] = {
            artFile: null,
            csvFile: null,
            artUploaded: month.art_file_uploaded,
            csvUploaded: month.csv_file_uploaded || false,
          };
        });
      });
      setFileUploadState(initialState);
    }
  }, [artFilesDetailsData]);

  const handleFileSelect = useCallback(
    (
      programId: string,
      monthNumber: number,
      fileType: "art" | "csv",
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileUploadState((prev) => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          [monthNumber]: {
            ...prev[programId]?.[monthNumber],
            [fileType === "art" ? "artFile" : "csvFile"]: file,
          },
        },
      }));
    },
    []
  );

  const handleRemoveFile = useCallback(
    (programId: string, monthNumber: number, fileType: "art" | "csv") => {
      setFileUploadState((prev) => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          [monthNumber]: {
            ...prev[programId]?.[monthNumber],
            [fileType === "art" ? "artFile" : "csvFile"]: null,
          },
        },
      }));

      // Reset file input
      const fileInput = document.getElementById(
        `${fileType}-${programId}-${monthNumber}`
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    },
    []
  );

  const handleUpload = useCallback(
    async (programId: string, monthNumber: number) => {
      if (!campaignId) {
        toast.error("Campaign ID is missing");
        return;
      }

      const uploadKey = `${programId}-${monthNumber}`;
      const state = fileUploadState[programId]?.[monthNumber];

      if (!state?.artFile) {
        toast.error("Please select an art file first");
        return;
      }

      setUploadingFiles((prev) => new Set(prev).add(uploadKey));

      const formData = new FormData();
      formData.append("campaign_id", campaignId);
      formData.append("program_id", programId);
      formData.append("month_number", monthNumber.toString());
      formData.append(
        "get_csv_file",
        artFilesDetails?.get_csv_files ? "true" : "false"
      );
      formData.append("art_file", state.artFile);

      if (artFilesDetails?.get_csv_files && state.csvFile) {
        formData.append("csv_file", state.csvFile);
      }

      callUploadArtFiles(
        uploadArtFilesApi(formData),
        () => {
          refetch();
          // Reset file inputs
          const artFileInput = document.getElementById(
            `art-${programId}-${monthNumber}`
          ) as HTMLInputElement;
          const csvFileInput = document.getElementById(
            `csv-${programId}-${monthNumber}`
          ) as HTMLInputElement;
          if (artFileInput) artFileInput.value = "";
          if (csvFileInput) csvFileInput.value = "";

          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(uploadKey);
            return next;
          });
        },
        () => {
          setUploadingFiles((prev) => {
            const next = new Set(prev);
            next.delete(uploadKey);
            return next;
          });
        }
      );
    },
    [campaignId, artFilesDetails, fileUploadState, callUploadArtFiles, refetch]
  );

  const allFilesUploaded = useCallback(() => {
    if (!artFilesDetails) return false;

    return artFilesDetails.programs.every((program) =>
      program.months.every((month) => {
        const state = fileUploadState[program.id]?.[month.month_number];
        const artUploaded = state?.artUploaded || month.art_file_uploaded;
        return artUploaded;
      })
    );
  }, [artFilesDetails, fileUploadState]);

  return {
    artFilesDetails,
    fileUploadState,
    uploadingFiles,
    loadingDetails,
    uploading,
    handleFileSelect,
    handleRemoveFile,
    handleUpload,
    allFilesUploaded,
  };
}
