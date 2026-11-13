"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApi } from "use-hook-api";
import { toast } from "react-toastify";
import {
  fetchUserCampaignsApi,
  type CampaignRecord,
} from "@/api/mediaBuyer";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { CampaignsDashboardTable } from "@/components/media-buyer/campaigns/CampaignsDashboardTable";
import { CreateCampaignStep1 } from "@/components/media-buyer/campaigns/CreateCampaignStep1";
import { CampaignProgramSelectionStep2 } from "@/components/media-buyer/campaigns/CampaignProgramSelectionStep2";
import { CampaignStepper } from "@/components/media-buyer/campaigns/CampaignStepper";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/apiError";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

type CampaignView = "dashboard" | "step1" | "step2" | "step3";

function MediaBuyerCampaignsContent() {
  const searchParams = useSearchParams();
  const initialCampaignId = searchParams.get("campaign_id");
  const initialStep = searchParams.get("step");

  const [view, setView] = useState<CampaignView>("dashboard");
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<CampaignRecord | null>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  // Pagination for Campaigns Dashboard
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    per_page: number;
    total: number;
    total_pages?: number;
  } | null>(null);

  // APIs
  const [callGetCampaigns, { loading }] = useApi({
    both: false,
    errMsg: false,
  });

  const callGetCampaignsRef = useRef(callGetCampaigns);
  callGetCampaignsRef.current = callGetCampaigns;

  const loadCampaigns = () => {
    callGetCampaignsRef.current(
      fetchUserCampaignsApi({ page, per_page: 25 }),
      (res: any) => {
        const list: CampaignRecord[] = res?.data ?? res ?? [];
        if (Array.isArray(list)) {
          setCampaigns(list);
        }
        if (res?.pagination) {
          setPagination(res.pagination);
        }
      },
      (err: any) => {
        const msg = extractErrorMessage(err, "Failed to load campaigns.");
        console.warn(msg);
      }
    );
  };

  useEffect(() => {
    loadCampaigns();
  }, [page]);

  // Handle direct navigation via URL query params if present
  useEffect(() => {
    if (initialCampaignId) {
      const found = campaigns.find((c) => c.id === initialCampaignId);
      if (found) {
        setActiveCampaign(found);
        setView(initialStep === "1" ? "step1" : "step2");
      } else {
        // Construct minimum active campaign record for direct continue
        setActiveCampaign({
          id: initialCampaignId,
          name: "Campaign",
          brand_id: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setView(initialStep === "1" ? "step1" : "step2");
      }
    }
  }, [initialCampaignId, initialStep, campaigns]);

  const handleOpenCreateStep1 = () => {
    setActiveCampaign(null);
    setView("step1");
  };

  const handleCampaignCreatedStep1 = (created: CampaignRecord) => {
    setActiveCampaign(created);
    setCampaigns((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
    setView("step2");
  };

  const handleContinueCampaign = (campaign: CampaignRecord) => {
    setActiveCampaign(campaign);
    setView("step2");
  };

  const handleBackToStep1 = () => {
    setView("step1");
  };

  const handleSaveDraftAndExit = () => {
    toast.success("Campaign draft saved successfully.");
    loadCampaigns();
    setView("dashboard");
  };

  const handleProceedToStep3 = (selectedProgramIds: string[]) => {
    setSelectedPrograms(selectedProgramIds);
    if (activeCampaign) {
      setActiveCampaign({
        ...activeCampaign,
        selected_programs: selectedProgramIds,
      });
    }
    setView("step3");
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* View 1: Campaigns Dashboard */}
      {view === "dashboard" && (
        <CampaignsDashboardTable
          campaigns={campaigns}
          loading={loading}
          onCreateCampaign={handleOpenCreateStep1}
          onContinueCampaign={handleContinueCampaign}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}

      {/* View 2: Step 1 - Brand Selection */}
      {view === "step1" && (
        <CreateCampaignStep1
          initialCampaignName={activeCampaign?.name || ""}
          initialBrandId={activeCampaign?.brand_id || ""}
          onCancel={() => setView("dashboard")}
          onSuccess={handleCampaignCreatedStep1}
        />
      )}

      {/* View 3: Step 2 - Program Selection */}
      {view === "step2" && activeCampaign && (
        <CampaignProgramSelectionStep2
          campaign={activeCampaign}
          onBack={handleBackToStep1}
          onSaveDraftAndExit={handleSaveDraftAndExit}
          onProceedToStep3={handleProceedToStep3}
        />
      )}

      {/* View 4: Step 3 Preview (Campaign Configurator) */}
      {view === "step3" && activeCampaign && (
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <CampaignStepper
            currentStep={3}
            onStepClick={(s) => {
              if (s === 1) setView("step1");
              if (s === 2) setView("step2");
            }}
          />

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
              <Sparkles className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              Step 3: Campaign Configurator
            </h2>

            <p className="text-sm text-gray-600 max-w-lg mx-auto">
              Programs selected: <span className="font-bold text-primary">{selectedPrograms.length} programs</span> for active campaign <span className="font-semibold text-gray-900">&ldquo;{activeCampaign.name}&rdquo;</span>.
            </p>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setView("step2")}
                className="h-10 px-5 text-sm font-semibold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Program Selection
              </Button>
              <Button
                onClick={() => {
                  toast.success("Campaign progress saved!");
                  loadCampaigns();
                  setView("dashboard");
                }}
                className="h-10 px-6 bg-blue-gradient text-white hover:bg-blue-gradient/90 shadow-sm text-sm font-semibold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Finish for Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MediaBuyerCampaignsPage() {
  return (
    <ProtectedRoute requiredRole={["media_buyer_admin", "media_buyer_standard"]}>
      <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading campaigns...</div>}>
        <MediaBuyerCampaignsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
