"use client";

import ManualAvailabilityReviewDetailPage from "../../manual-availability-reviews/[campaignId]/page";

export default function CompleteBookingReviewCampaignDetailsPage() {
  return (
    <ManualAvailabilityReviewDetailPage
      fromBookingReviewOverride={true}
      fetchInstantProgramsOverride={true}
    />
  );
}
