"use client";

import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { DashboardNavbar } from "@/components/common/DashboardNavbar";
import { useMe } from "@/hooks/useMe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus, FolderOpen } from "lucide-react";
import { useApi } from "use-hook-api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCampaignsApi } from "../../api/campaigns";

interface Campaign {
  id: string;
  category_matched?: boolean;
  created?: string;
  insert_prediction_id?: string | null;
  review_status?: string;
  self_declared_category?: string;
  status?: string;
  updated?: string;
  user_id?: string;
  [key: string]: any;
}

export default function Home() {
  const router = useRouter();
  const userData = useMe();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [callCampaignsApi, { loading: campaignsLoading }] = useApi({ errMsg: false });

  useEffect(() => {
    if (userData) {
      // Fetch campaigns when user data is available
      callCampaignsApi(fetchCampaignsApi(), ({ data }: any) => {
        if (data && Array.isArray(data)) {
          setCampaigns(data);
        } else if (data?.campaigns && Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleCreateCampaign = () => {
    router.push("/create-campaign");
  };

  const getUserName = () => {
    if (!userData) return "User";
    return userData.name || userData.username || userData.email?.split("@")[0] || "User";
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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Campaign {campaign.id.slice(0, 8)}...
                          </h3>
                          
                          <div className="space-y-1 mb-3">
                            {campaign.self_declared_category && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Category:</span> {campaign.self_declared_category}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-3 flex-wrap">
                              {campaign.status && (
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                  Status: {campaign.status}
                                </span>
                              )}
                              
                              {campaign.category_matched !== undefined && (
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                  campaign.category_matched 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {campaign.category_matched ? 'Category Matched' : 'Category Mismatch'}
                                </span>
                              )}
                              
                              {campaign.review_status && campaign.review_status !== "None" && (
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                                  Review: {campaign.review_status}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            {campaign.created && (
                              <p>
                                Created: {new Date(campaign.created).toLocaleDateString()}
                              </p>
                            )}
                            {campaign.updated && (
                              <p>
                                Updated: {new Date(campaign.updated).toLocaleDateString()}
                              </p>
                            )}
                          </div>
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
