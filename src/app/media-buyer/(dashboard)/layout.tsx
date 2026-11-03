import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { MediaBuyerLayoutWrapper } from "@/components/media-buyer/MediaBuyerLayoutWrapper";

export default function MediaBuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole={["media_buyer_admin", "media_buyer_standard"]}>
      <MediaBuyerLayoutWrapper>{children}</MediaBuyerLayoutWrapper>
    </ProtectedRoute>
  );
}
