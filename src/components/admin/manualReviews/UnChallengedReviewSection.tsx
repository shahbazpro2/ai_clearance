import { fetchManualReviewsApi, submitManualReviewApi, viewGcpFileApi } from "@/api/admin";
import { fetchCategoriesApi } from "@/api/categories";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/useCategories";
import { formatDate } from "@/lib/utils";
import { Check, Eye, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useApi } from "use-hook-api";
import { SampleViewerDialog } from "./SampleViewerDialog";
import { atom, useAtom } from "jotai";

const statusFilterAtom = atom<string>("pending");
export default function UnchallengedReviewsSection() {
    const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [reviewAction, setReviewAction] = useState<"approve" | "deny" | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [getReviews, { data: reviewsData, loading: reviewsLoading }] = useApi({ cache: 'unchallenged-reviews' });
    const [viewFile, { loading: viewingFile }] = useApi({});
    const [submitReview, { loading: submittingReview }] = useApi({});
    const { categoryNames } = useCategories();

    const fetchReviews = useCallback(() => {
        getReviews(fetchManualReviewsApi({
            is_challenged: false,
            status: statusFilter
        }));
    }, [statusFilter]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);


    const handleViewSample = async (gcpPath: string) => {
        try {
            const res = await viewFile(viewGcpFileApi({ view_gcp_file: gcpPath })) as any;
            if (res?.data?.redirect_url) {
                setPreviewUrl(res.data.redirect_url);
            } else {
                toast.error("Failed to get file URL");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error viewing file");
        }
    };

    const openReviewDialog = (item: any, action: "approve" | "deny") => {
        setSelectedReview(item);
        setReviewAction(action);
        setFeedback("");
        setSelectedCategory("");
    };

    const closeReviewDialog = () => {
        setSelectedReview(null);
        setReviewAction(null);
        setFeedback("");
        setSelectedCategory("");
    };

    const handleSubmitReview = async () => {
        if (!selectedReview || !reviewAction) return;
        if (reviewAction === "deny" && !selectedCategory) {
            toast.error("Please select a correct category");
            return;
        }
        try {
            const payload = {
                campaign_id: selectedReview.campaign_id,
                is_approved: reviewAction === "approve",
                feedback: feedback,
                category_id: reviewAction === "deny" ? selectedCategory : undefined
            };
            await submitReview(submitManualReviewApi(payload));
            toast.success("Review submitted successfully");
            closeReviewDialog();
            fetchReviews();
        } catch (err) {
            console.error(err);
            toast.error("Error submitting review");
        }
    };

    const reviews = reviewsData || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {reviewsLoading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="mt-2 text-gray-500">Loading reviews...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No {statusFilter} records found for unchallenged reviews.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Advertiser
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Updated At
                                    </th>
                                    {
                                        statusFilter !== "pending" && (
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reviewed Category
                                            </th>
                                        )
                                    }
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        AI Predicted
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sample
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reviews.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.created_at ? formatDate(item.created_at) : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.updated_at ? formatDate(item.updated_at) : "-"}
                                        </td>
                                        {
                                            statusFilter !== "pending" && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.reviewed_category ? categoryNames[item.reviewed_category] : item.reviewed_category || "-"}
                                                </td>
                                            )
                                        }
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.self_declared_category ? categoryNames[item.self_declared_category] : item.self_declared_category || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.ai_predicted_category ? categoryNames[item.ai_predicted_category] : item.ai_predicted_category || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleViewSample(item.view_gcp_file)}
                                                disabled={viewingFile}
                                            >
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => openReviewDialog(item, "approve")}
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => openReviewDialog(item, "deny")}
                                                >
                                                    <X className="h-4 w-4 mr-1" /> Deny
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedReview} onOpenChange={(open) => !open && closeReviewDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {reviewAction === "approve" ? "Approve Category" : "Deny & Correct Category"}
                        </DialogTitle>
                        <DialogDescription>
                            {reviewAction === "approve"
                                ? "Are you sure you want to approve the AI's category selection?"
                                : "Please select the correct category for this campaign."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {reviewAction === "deny" && (
                            <div className="space-y-2">
                                <Label>Correct Category</Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categoryNames).map(([id, name]) => (
                                            <SelectItem key={id} value={id}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Feedback (Optional)</Label>
                            <Textarea
                                placeholder="Add any comments..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeReviewDialog}>Cancel</Button>
                        <Button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || (reviewAction === "deny" && !selectedCategory)}
                        >
                            {submittingReview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Submit Review
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SampleViewerDialog open={!!previewUrl} url={previewUrl} onClose={() => setPreviewUrl(null)} />
        </div>
    );
}
