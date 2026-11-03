"use client";

import { useAtomValue } from "jotai";
import { mediaBuyerSidebarCollapsedAtom } from "@/store/ui";
import { cn } from "@/lib/utils";
import { MediaBuyerSidebar } from "@/components/media-buyer/MediaBuyerSidebar";
import { MediaBuyerHeader } from "@/components/media-buyer/MediaBuyerHeader";

export function MediaBuyerLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const collapsed = useAtomValue(mediaBuyerSidebarCollapsedAtom);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <MediaBuyerSidebar />

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col min-h-screen pt-14 md:pt-0 transition-all duration-300 ease-in-out",
          collapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        <MediaBuyerHeader />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
