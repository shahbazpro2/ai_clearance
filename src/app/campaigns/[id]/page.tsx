"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { DashboardNavbar } from "@/components/common/DashboardNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, User, Tag, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { useApi } from "use-hook-api";
import { fetchCampaignDetailsApi } from "../../../../api/campaigns";
import { fetchCategoriesApi } from "../../../../api/categories";

interface CampaignDetails {
  campaign: {
    id: string;
    name: string;
    booking_status: string;
    current_stage: string;
    created: string;
    updated: string;
    user_id: string;
    locked_target_months: string[] | null;
    category: {
      ai_predicted_category_id: string | null;
      category_matched: boolean;
      category_verification_status: string;
      confirmed_category_id: string | null;
      predicted_category_accepted: boolean;
      review_status: string;
      self_declared_category: string | null;
    };
    program_flags: {
      any_manual_availability_pending: boolean;
      any_manual_availability_required: boolean;
    };
    programs: any[];
  };
  success: boolean;
}

// Map current_stage to step number for editing
const getStepFromStage = (stage: string): number => {
  const stageMap: Record<string, number> = {
    "campaign_creation": 1,
    "category_selection": 2,
    "upload_classify": 3,
    "category_mismatch": 4,
    "programs_selection": 5,
    "program_selection": 5, // Alternative naming
    "availability_planning": 6,
  };
  return stageMap[stage] || 1;
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;
  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  
  const [callCampaignDetails, { loading: loadingDetails }] = useApi({ errMsg: true });
  const [callFetchCategories, { loading: loadingCategories }] = useApi({ errMsg: false });

  useEffect(() => {
    if (campaignId) {
      callCampaignDetails(fetchCampaignDetailsApi(campaignId), ({ data }: any) => {
        if (data?.campaign) {
          setCampaignDetails(data);
          
          // Fetch category name if self_declared_category exists
          if (data.campaign.category?.self_declared_category) {
            callFetchCategories(fetchCategoriesApi(), ({ data: categoriesData }: any) => {
              const categories = categoriesData?.categories || categoriesData || [];
              const category = categories.find(
                (cat: any) => String(cat.id || cat.category) === String(data.campaign.category.self_declared_category)
              );
              if (category) {
                setCategoryName(category.category || category.name || category.label || category.title || "Unknown");
              }
            });
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const handleEdit = () => {
    if (!campaignDetails?.campaign) return;
    const step = getStepFromStage(campaignDetails.campaign.current_stage);
    router.push(`/create-campaign?campaign_id=${campaignId}&step=${step}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      submitted: { variant: "default", label: "Submitted" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    const config = statusConfig[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getVerificationStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      verified: { variant: "default", icon: CheckCircle2 },
      unverified: { variant: "secondary", icon: Clock },
      rejected: { variant: "destructive", icon: XCircle },
    };
    const config = statusConfig[status] || { variant: "secondary" as const, icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loadingDetails) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!campaignDetails?.campaign) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Campaign not found</p>
                  <Button onClick={() => router.push("/")} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const { campaign } = campaignDetails;

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <DashboardNavbar />
        
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
                <p className="text-gray-600">Campaign ID: {campaign.id}</p>
              </div>
              <Button onClick={handleEdit} className="bg-blue-gradient text-white hover:bg-blue-gradient/90">
                <Edit className="mr-2 h-4 w-4" />
                Edit Campaign
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Booking Status</p>
                  <div>{getStatusBadge(campaign.booking_status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Current Stage</p>
                  <Badge variant="outline" className="capitalize">
                    {campaign.current_stage.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(campaign.created).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(campaign.updated).toLocaleString()}
                  </p>
                </div>
                {campaign.locked_target_months && campaign.locked_target_months.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Locked Target Months</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.locked_target_months.map((month, idx) => (
                        <Badge key={idx} variant="outline" className="capitalize">
                          {month}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Category Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Self Declared Category</p>
                  {campaign.category.self_declared_category ? (
                    <div>
                      <p className="text-sm text-gray-900 mb-1">
                        {categoryName || campaign.category.self_declared_category}
                      </p>
                      <p className="text-xs text-gray-500">ID: {campaign.category.self_declared_category}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not set</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">AI Predicted Category</p>
                  {campaign.category.ai_predicted_category_id ? (
                    <p className="text-sm text-gray-900">{campaign.category.ai_predicted_category_id}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Not available</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Category Matched</p>
                  <div className="flex items-center gap-2">
                    {campaign.category.category_matched ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">No</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Verification Status</p>
                  {getVerificationStatusBadge(campaign.category.category_verification_status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Predicted Category Accepted</p>
                  <div className="flex items-center gap-2">
                    {campaign.category.predicted_category_accepted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">No</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Review Status</p>
                  <Badge variant={campaign.category.review_status === "None" ? "secondary" : "default"}>
                    {campaign.category.review_status}
                  </Badge>
                </div>
                {campaign.category.confirmed_category_id && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Confirmed Category ID</p>
                    <p className="text-sm text-gray-900">{campaign.category.confirmed_category_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Program Flags */}
            <Card>
              <CardHeader>
                <CardTitle>Program Flags</CardTitle>
                <CardDescription>Availability and manual review flags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Manual Availability Required</p>
                  <div className="flex items-center gap-2">
                    {campaign.program_flags.any_manual_availability_required ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">No</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Manual Availability Pending</p>
                  <div className="flex items-center gap-2">
                    {campaign.program_flags.any_manual_availability_pending ? (
                      <>
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-600">Yes</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">No</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Programs */}
            <Card>
              <CardHeader>
                <CardTitle>Programs</CardTitle>
                <CardDescription>
                  {campaign.programs?.length || 0} program{campaign.programs?.length !== 1 ? "s" : ""} associated
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaign.programs && campaign.programs.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.programs.map((program: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <p className="text-sm font-medium text-gray-900">
                          {program.name || program.program_name || `Program ${idx + 1}`}
                        </p>
                        {program.id && (
                          <p className="text-xs text-gray-500 mt-1">ID: {program.id}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No programs associated yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

