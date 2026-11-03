"use client";

import { MediaBuyerProfileMenu } from "@/components/media-buyer/MediaBuyerProfileMenu";
import { useMe } from "@/hooks/useMe";

export function MediaBuyerHeader() {
  const userData = useMe();
  const isAdmin = userData?.role === "media_buyer_admin";

  return (
    <header className="sticky top-0 z-30 hidden md:flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-6 shadow-xs">
      {/* Brand & Portal Tag */}
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-gray-900 tracking-tight">
          Insert Media — Media Buyer Portal
        </span>
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase tracking-wider">
          {isAdmin ? "Media Buyer Admin" : "Media Buyer"}
        </span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center pl-2 border-l border-gray-200">
          <MediaBuyerProfileMenu />
        </div>
      </div>
    </header>
  );
}
