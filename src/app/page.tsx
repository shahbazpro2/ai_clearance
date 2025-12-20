"use client";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { DashboardNavbar } from "@/components/common/DashboardNavbar";
import { useMe } from "@/hooks/useMe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus, FolderOpen, Eye, Edit } from "lucide-react";
import { useApi } from "use-hook-api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCampaignsApi, fetchCampaignDetailsApi } from "../../api/campaigns";
import { fetchCategoriesApi } from "../../api/categories";

interface Campaign {
  id: string;
  name?: string;
  created?: string;
  category_matched?: boolean;
  review_status?: string;
  self_declared_category?: string;
  confirmed_category_id?: string;
  status?: string;
  updated?: string;
  user_id?: string;
  current_stage?: string;
  category?: {
    confirmed_category_id?: string | null;
    self_declared_category?: string | null;
    category_matched?: boolean;
    review_status?: string;
  };
  [key: string]: any;
}

// Map current_stage to step number for editing
const getStepFromStage = (stage?: string): number => {
  if (!stage) return 1;
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

export default function Home() {
  const router = useRouter();
  const userData = useMe();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [callCampaignsApi, { loading: campaignsLoading }] = useApi({ errMsg: false });
  const [callCampaignDetails, { loading: loadingDetails }] = useApi({ errMsg: true });
  const [callFetchCategories] = useApi({ errMsg: false });

  useEffect(() => {
    // Fetch campaigns when user data is available
    callCampaignsApi(fetchCampaignsApi(), ({ data }: any) => {
      const campaignsList = data && Array.isArray(data) ? data : (data?.campaigns && Array.isArray(data.campaigns) ? data.campaigns : []);
      setCampaigns(campaignsList);

      // Fetch categories to get category names
      if (campaignsList.length > 0) {
        callFetchCategories(fetchCategoriesApi(), ({ data: categoriesData }: any) => {
          const categories = categoriesData?.categories || categoriesData || [];
          const categoryMap: Record<string, string> = {};

          categories.forEach((cat: any) => {
            const catId = String(cat.id || cat.category || "");
            const catName = cat.category || cat.name || cat.label || cat.title || catId;
            if (catId) {
              categoryMap[catId] = catName;
            }
          });

          setCategoryNames(categoryMap);
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCampaign = () => {
    router.push("/create-campaign");
  };

  const getUserName = () => {
    if (!userData) return "User";
    return userData.name || userData.username || userData.email?.split("@")[0] || "User";
  };

  const handleEditCampaign = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCampaignId(campaignId);

    // Fetch campaign details first to get accurate current_stage
    callCampaignDetails(fetchCampaignDetailsApi(campaignId), ({ data }: any) => {
      if (data?.campaign) {
        const currentStage = data.campaign.current_stage;
        const step = getStepFromStage(currentStage);
        // Navigate to edit page with campaign ID and step
        router.push(`/create-campaign?campaign_id=${campaignId}&step=${step}`);
      } else {
        // Fallback: navigate with step 1 if details fetch fails
        router.push(`/create-campaign?campaign_id=${campaignId}&step=1`);
      }
      setEditingCampaignId(null);
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <DashboardNavbar />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {getUserName()}
            </h1>
            <p className="text-gray-600">
              Manage your campaigns and create new ones to get started.
            </p>
          </div>

          {/* Create Campaign Button */}
          <div className="mb-8">
            <Button
              onClick={handleCreateCampaign}
              size="lg"
              className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Campaign
            </Button>
          </div>

          {/* Previous Campaigns Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Previous Campaigns
                  </CardTitle>
                  <CardDescription>
                    View your previous campaign records (read-only)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No campaigns yet</p>
                  <p className="text-gray-400 text-sm">
                    Create your first campaign to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        >
                          {/* Campaign Name */}
                          <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                            {campaign.name || `Campaign ${campaign.id.slice(0, 8)}...`}
                          </h3>

                          <div className="space-y-2 mb-3">
                            {/* Created Date */}
                            {campaign.created && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Created:</span> {new Date(campaign.created).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            )}

                            {/* Category: Confirmed Category (if available), otherwise Self-Declared Category */}
                            {(() => {
                              const categoryId = campaign.category?.confirmed_category_id
                                || campaign.confirmed_category_id
                                || campaign.category?.self_declared_category
                                || campaign.self_declared_category;

                              if (categoryId) {
                                const categoryName = categoryNames[categoryId] || categoryId;
                                const isConfirmed = !!(campaign.category?.confirmed_category_id || campaign.confirmed_category_id);

                                return (
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">{isConfirmed ? 'Confirmed Category' : 'Self-Declared Category'}:</span> {categoryName}
                                  </p>
                                );
                              }
                              return null;
                            })()}

                            {/* Tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Category Matched tag */}
                              {campaign.category_matched !== undefined && (
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${campaign.category_matched
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                  }`}>
                                  {campaign.category_matched ? 'Category Matched' : 'Category Mismatch'}
                                </span>
                              )}

                              {/* Manual Review Status (only if not None) */}
                              {(() => {
                                const reviewStatus = campaign.category?.review_status || campaign.review_status;
                                if (reviewStatus && reviewStatus !== "None" && reviewStatus !== "none") {
                                  return (
                                    <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 border border-blue-300">
                                      Review: {reviewStatus}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/campaigns/${campaign.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-gradient text-white hover:bg-blue-gradient/90"
                            onClick={(e) => handleEditCampaign(campaign.id, e)}
                            disabled={editingCampaignId === campaign.id || loadingDetails}
                          >
                            {editingCampaignId === campaign.id && loadingDetails ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2 h-4 w-4" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
