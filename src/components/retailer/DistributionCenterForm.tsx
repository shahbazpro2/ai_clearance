"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApi } from "use-hook-api";
import { useRouter } from "next/navigation";
import { useSetAtom, useAtomValue } from "jotai";
import {
  getDistributionCentersApi,
  getUSStateCodesApi,
  distributionCenterSetupApi,
} from "@/api/retailer";
import { retailerSetupContextAtom } from "@/store/retailerSetup";
import { useMe } from "@/hooks/useMe";
import { SetupProgressHeader } from "@/components/retailer/SetupProgressHeader";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ChevronLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DCCardsList } from "./DCCardsList";
import { DCFormFields } from "./DCFormFields";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistributionCenter {
  allocation_percentage: number;
  city: string;
  country_code: string;
  distribution_center_name: string;
  distribution_center_salesforce_id: string | null;
  inventory_contact: {
    Email: string;
    FirstName: string;
    LastName: string;
    Phone: string;
  };
  ship_to_name: string;
  shipping_address_1: string;
  shipping_address_2: string;
  shipping_instructions: string;
  state: string;
  status: string;
  zip_code: string;
}

interface DistributionCenterWithStatus extends DistributionCenter {
  localStatus: "active" | "inactive";
}

interface StateCode {
  value: string;
  label: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const dcSchema = z.object({
  distribution_center_name: z.string().min(1, "DC name is required"),
  allocation_percentage: z.coerce.number().min(0).max(100, "Must be 0-100"),
  inventory_contact: z.object({
    FirstName: z.string().min(1, "First name is required"),
    LastName: z.string().min(1, "Last name is required"),
    Email: z.string().email("Invalid email"),
    Phone: z.string().min(1, "Phone is required"),
  }),
  ship_to_name: z.string().min(1, "Ship to name is required"),
  shipping_address_1: z.string().min(1, "Address is required"),
  shipping_address_2: z.string().optional().default(""),
  shipping_instructions: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "ZIP code is required"),
});

type DCFormData = z.infer<typeof dcSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface DistributionCenterFormProps {
  audienceId: string;
  channelId: string;
  allowRetailerRole?: boolean;
  onSaveSuccess?: () => void;
}

export function DistributionCenterForm({
  audienceId,
  channelId,
  allowRetailerRole = false,
  onSaveSuccess,
}: DistributionCenterFormProps) {
  const router = useRouter();
  const userData = useMe();
  const ctx = useAtomValue(retailerSetupContextAtom);
  const setCtx = useSetAtom(retailerSetupContextAtom);

  // Store DCs as object with ID as key instead of array
  const [distributionCentersMap, setDistributionCentersMap] = useState<Record<string, DistributionCenterWithStatus>>({});
  const [selectedDCId, setSelectedDCId] = useState<string | null>(null);
  const [dcOrder, setDcOrder] = useState<string[]>([]); // Track order for display
  // Ref to suppress watch side-effects while programmatically loading a DC into the form
  const isLoadingFormData = useRef(false);
  // Snapshot of saved form values for detecting unsaved changes
  const savedSnapshotRef = useRef<DCFormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  // Track which DCs have been individually saved (loaded from API or saved via Save button)
  const [savedDCIds, setSavedDCIds] = useState<Set<string>>(new Set());
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});

  const [callFetchDCs, { data: dcsData, loading: loadingDCs, error: dcError }] = useApi({ errMsg: true });
  const [callFetchStates, { data: statesData, loading: loadingStates, error: stateError }] = useApi({ errMsg: true });
  const [callSubmit, { loading: submitting }] = useApi({ errMsg: true, fullRes: true });

  const stateCodes = statesData?.state_codes ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors, isValid },
  } = useForm<DCFormData>({
    resolver: zodResolver(dcSchema) as any,
    mode: "onChange",
  });

  // No watch-based auto-sync — form data is flushed to the map explicitly
  // in handleSelectDC / handleRemove / onSubmit to avoid stale-closure bugs.

  // Watch all form fields to detect unsaved changes
  useEffect(() => {
    if (selectedDCId === null || !savedSnapshotRef.current) {
      setHasChanges(false);
      return;
    }

    const subscription = watch((value) => {
      if (isLoadingFormData.current || !savedSnapshotRef.current) {
        return;
      }
      const current = value as Partial<DCFormData>;
      const saved = savedSnapshotRef.current;
      const changed =
        current.distribution_center_name !== saved.distribution_center_name ||
        Number(current.allocation_percentage) !== Number(saved.allocation_percentage) ||
        current.inventory_contact?.FirstName !== saved.inventory_contact?.FirstName ||
        current.inventory_contact?.LastName !== saved.inventory_contact?.LastName ||
        current.inventory_contact?.Email !== saved.inventory_contact?.Email ||
        current.inventory_contact?.Phone !== saved.inventory_contact?.Phone ||
        current.ship_to_name !== saved.ship_to_name ||
        current.shipping_address_1 !== saved.shipping_address_1 ||
        (current.shipping_address_2 || "") !== (saved.shipping_address_2 || "") ||
        (current.shipping_instructions || "") !== (saved.shipping_instructions || "") ||
        current.city !== saved.city ||
        current.state !== saved.state ||
        current.zip_code !== saved.zip_code;
      setHasChanges(changed);
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedDCId]);


  // Fetch distribution centers and states
  useEffect(() => {
    if (!channelId) return;
    callFetchDCs(getDistributionCentersApi(channelId, allowRetailerRole ? true : undefined));
    callFetchStates(getUSStateCodesApi());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  // Helper function to get consistent DC ID - use salesforce_id as primary key
  const getDCId = (dc: DistributionCenter): string => {
    return dc.distribution_center_salesforce_id || `temp_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Load DCs from API and select first one
  useEffect(() => {
    const dcs = dcsData?.distribution_centers ?? [];
    if (dcs.length > 0) {
      const dcMap: Record<string, DistributionCenterWithStatus> = {};
      const order: string[] = [];

      dcs.forEach((dc: DistributionCenter) => {
        const dcId = getDCId(dc);
        dcMap[dcId] = {
          ...dc,
          localStatus: (dc.status?.toLowerCase() === "active" ? "active" : "inactive") as "active" | "inactive",
        };
        order.push(dcId);
      });

      setDistributionCentersMap(dcMap);
      setDcOrder(order);
      // Mark all API-loaded DCs as saved
      setSavedDCIds(new Set(order));

      if (selectedDCId === null && order.length > 0) {
        const firstId = order[0];
        setSelectedDCId(firstId);
        loadDCIntoForm(dcMap[firstId]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dcsData?.distribution_centers?.length]);

  const loadDCIntoForm = (dc: DistributionCenter) => {
    isLoadingFormData.current = true;
    setValue("distribution_center_name", dc.distribution_center_name);
    setValue("allocation_percentage", dc.allocation_percentage);
    setValue("inventory_contact.FirstName", dc.inventory_contact?.FirstName);
    setValue("inventory_contact.LastName", dc.inventory_contact?.LastName);
    setValue("inventory_contact.Email", dc.inventory_contact?.Email);
    setValue("inventory_contact.Phone", dc.inventory_contact?.Phone);
    setValue("ship_to_name", dc.ship_to_name);
    setValue("shipping_address_1", dc.shipping_address_1);
    setValue("shipping_address_2", dc.shipping_address_2);
    setValue("shipping_instructions", dc.shipping_instructions);
    setValue("city", dc.city);
    setValue("state", dc.state);
    setValue("zip_code", dc.zip_code);
    isLoadingFormData.current = false;

    // Update saved snapshot after loading DC
    savedSnapshotRef.current = {
      distribution_center_name: dc.distribution_center_name,
      allocation_percentage: dc.allocation_percentage,
      inventory_contact: {
        FirstName: dc.inventory_contact?.FirstName || "",
        LastName: dc.inventory_contact?.LastName || "",
        Email: dc.inventory_contact?.Email || "",
        Phone: dc.inventory_contact?.Phone || "",
      },
      ship_to_name: dc.ship_to_name,
      shipping_address_1: dc.shipping_address_1,
      shipping_address_2: dc.shipping_address_2 || "",
      shipping_instructions: dc.shipping_instructions || "",
      city: dc.city,
      state: dc.state,
      zip_code: dc.zip_code,
    };
    setHasChanges(false);
  };

  // Restrict access for retailer role (unless explicitly allowed)
  if (userData && userData.role === "retailer" && !allowRetailerRole) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto mt-12">
            <Card>
              <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Access Restricted
                </h2>
                <p className="text-sm text-gray-600 max-w-xs">
                  This page is only available for setup administrators. Please contact your account manager.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Compute total allocation live — read current DC's allocation directly from the form
  // so we never need to update distributionCentersMap on every keystroke.
  const liveAllocation = watch("allocation_percentage");
  const totalAllocation = dcOrder.reduce((sum: number, id: string) => {
    const dc = distributionCentersMap[id];
    if (!dc || dc.localStatus !== "active") return sum;
    const allocation = id === selectedDCId
      ? (parseFloat(String(liveAllocation)) || 0)
      : (typeof dc.allocation_percentage === "string" ? parseFloat(dc.allocation_percentage) || 0 : dc.allocation_percentage || 0);
    return sum + allocation;
  }, 0);
  const activeCount = dcOrder.filter(id => distributionCentersMap[id]?.localStatus === "active").length;
  const isAllocationValid = totalAllocation === 100 || (activeCount === 0 && dcOrder.length > 0);
  const allSaved = dcOrder.length > 0 && dcOrder.every(id => savedDCIds.has(id));

  const onSubmit: SubmitHandler<DCFormData> = (data) => {
    if (!isAllocationValid) return;

    // Save current form data to map before submitting
    saveCurrentDCData(data);

    // Build final DCs array - only include active DCs
    const updatedDCs = dcOrder
      .map(id => distributionCentersMap[id])
      .filter(dc => dc.localStatus === "active")
      .map(dc => ({
        allocation_percentage: typeof dc.allocation_percentage === "string"
          ? parseFloat(dc.allocation_percentage) || 0
          : (dc.allocation_percentage || 0),
        city: dc.city,
        country_code: dc.country_code,
        distribution_center_name: dc.distribution_center_name,
        distribution_center_salesforce_id: dc.distribution_center_salesforce_id,
        inventory_contact: dc.inventory_contact,
        ship_to_name: dc.ship_to_name,
        shipping_address_1: dc.shipping_address_1,
        shipping_address_2: dc.shipping_address_2,
        shipping_instructions: dc.shipping_instructions,
        state: dc.state,
        status: "active",
        zip_code: dc.zip_code,
      }));

    callSubmit(
      distributionCenterSetupApi({
        audience_id: audienceId,
        current_step_name: "distribution_center",
        form_data: {
          channel_id: channelId,
          distribution_centers: updatedDCs,
        },
      }),
      () => {
        if (onSaveSuccess) {
          onSaveSuccess();
        } else {
          if (ctx) {
            setCtx({ ...ctx, currentStep: 4 });
          }
          router.push(`/retailer/audiences/setup/step/${audienceId}/4`);
        }
      },
      ({ fullRes }: any) => {
        const validationErrors = fullRes?.validation_errors || {};
        setApiErrors(validationErrors);
      }
    );
  };

  const handleSaveCurrentDC = async () => {
    if (selectedDCId === null) return;
    const validated = await trigger();
    if (!validated) return;
    const formData = getValues();
    saveCurrentDCData(formData as DCFormData);
    // Update snapshot after saving so Save button becomes disabled
    savedSnapshotRef.current = formData as DCFormData;
    setHasChanges(false);
    // Mark this DC as saved for Save All gate
    setSavedDCIds(prev => new Set(prev).add(selectedDCId));
  };

  const canAddNew = selectedDCId === null ? true : isValid;

  const handleAddNew = () => {
    // Save current DC before adding new one
    if (selectedDCId !== null) {
      saveCurrentDCData(watch() as DCFormData);
    }
    const newId = `temp_${Math.random().toString(36).substr(2, 9)}`;
    const newDC: DistributionCenterWithStatus = {
      allocation_percentage: 0,
      city: "",
      country_code: "US",
      distribution_center_name: "",
      distribution_center_salesforce_id: null,
      inventory_contact: {
        Email: "",
        FirstName: "",
        LastName: "",
        Phone: "",
      },
      ship_to_name: "",
      shipping_address_1: "",
      shipping_address_2: "",
      shipping_instructions: "",
      state: "",
      status: "active",
      localStatus: "active",
      zip_code: "",
    };
    setDistributionCentersMap(prev => ({ ...prev, [newId]: newDC }));
    setDcOrder(prev => [...prev, newId]);
    setSelectedDCId(newId);
    // Load the new empty DC into the form
    loadDCIntoForm(newDC);
  };

  const handleRemove = (dcId: string) => {
    const updated = { ...distributionCentersMap };
    delete updated[dcId];
    setDistributionCentersMap(updated);

    const newOrder = dcOrder.filter(id => id !== dcId);
    setDcOrder(newOrder);
    // Remove from saved set when DC is removed
    setSavedDCIds(prev => {
      const next = new Set(prev);
      next.delete(dcId);
      return next;
    });

    if (selectedDCId === dcId) {
      const firstId = newOrder.length > 0 ? newOrder[0] : null;
      setSelectedDCId(firstId);
      if (firstId) {
        loadDCIntoForm(updated[firstId]);
      }
    }
  };

  const saveCurrentDCData = (formData: DCFormData) => {
    if (selectedDCId !== null && distributionCentersMap[selectedDCId]) {
      const allocation = typeof formData.allocation_percentage === "string"
        ? parseFloat(formData.allocation_percentage) || 0
        : (formData.allocation_percentage || 0);

      setDistributionCentersMap((prev) => ({
        ...prev,
        [selectedDCId]: {
          ...prev[selectedDCId],
          distribution_center_name: formData.distribution_center_name || "",
          allocation_percentage: allocation,
          inventory_contact: {
            FirstName: formData.inventory_contact?.FirstName || "",
            LastName: formData.inventory_contact?.LastName || "",
            Email: formData.inventory_contact?.Email || "",
            Phone: formData.inventory_contact?.Phone || "",
          },
          ship_to_name: formData.ship_to_name || "",
          shipping_address_1: formData.shipping_address_1 || "",
          shipping_address_2: formData.shipping_address_2 || "",
          shipping_instructions: formData.shipping_instructions || "",
          city: formData.city || "",
          state: formData.state || "",
          zip_code: formData.zip_code || "",
          localStatus: prev[selectedDCId].localStatus,
        },
      }));
    }
  };

  const handleSelectDC = (dcId: string) => {
    if (selectedDCId === dcId) return;
    const currentFormData = watch();
    saveCurrentDCData(currentFormData as DCFormData);
    setSelectedDCId(dcId);
    loadDCIntoForm(distributionCentersMap[dcId]);
  };

  const handleStatusChange = (newStatus: "active" | "inactive") => {
    if (!selectedDCId) return;
    setDistributionCentersMap((prev) => ({
      ...prev,
      [selectedDCId]: { ...prev[selectedDCId], localStatus: newStatus },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!allowRetailerRole && <SetupProgressHeader stepOverride={4} />}

      {!allowRetailerRole && (
        <div className="bg-white border-b sticky top-14 z-20">
          <div className="container mx-auto px-4 py-3">
            <button
              onClick={() => router.push(`/retailer/audiences/setup/step/${audienceId}/4`)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Channels
            </button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Distribution Centers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add and configure distribution centers for this channel.
          </p>
        </div>

        {(loadingDCs || loadingStates) && !dcError && !stateError ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col justify-center items-center">
              <LoadingSpinner size="lg" className="mb-4" />
              <div className="text-sm text-gray-600">Loading distribution centers...</div>
            </div>
          </div>
        ) : (dcError || stateError) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-red-600">Failed to load data. Please try again.</p>
            <Button
              variant="outline"
              onClick={() => {
                callFetchDCs(getDistributionCentersApi(channelId, allowRetailerRole ? true : undefined));
                callFetchStates(getUSStateCodesApi());
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cards List */}
            <DCCardsList
              distributionCenters={dcOrder.map(id => distributionCentersMap[id])}
              dcIds={dcOrder}
              selectedDCId={selectedDCId}
              totalAllocation={totalAllocation}
              isAllocationValid={isAllocationValid}
              loadingDCs={loadingDCs}
              onSelectDC={handleSelectDC}
              onRemoveDC={handleRemove}
              onAddNew={handleAddNew}
              canAddNew={canAddNew}
            />

            {/* Form Section */}
            <div className="lg:col-span-2 space-y-4">
              {selectedDCId !== null && (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <DCFormFields
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                    stateCodes={stateCodes}
                    loadingStates={loadingStates}
                    submitting={submitting}
                    isAllocationValid={isAllocationValid}
                    onSave={handleSaveCurrentDC}
                    disableSave={!hasChanges}
                    dcStatus={distributionCentersMap[selectedDCId]?.localStatus || "active"}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              )}

              {/* API Validation Errors */}
              {Object.keys(apiErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700 mb-2">Validation Errors:</p>
                  <ul className="space-y-1">
                    {Object.entries(apiErrors).map(([field, message]) => (
                      <li key={field} className="text-sm text-red-600">
                        • {field}: {message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submit All Button - Outside Form */}
              {selectedDCId !== null && (
                <div className="bg-white rounded-xl border shadow-sm p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ready to submit all distributions?</p>
                    <p className="text-xs text-gray-500 mt-0.5">This will save all {dcOrder.length} distribution center(s) for this channel.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      disabled={submitting || !isAllocationValid || !allSaved}
                      className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                    >
                      {submitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Saving All...
                        </>
                      ) : (
                        "Save All Distributions"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
