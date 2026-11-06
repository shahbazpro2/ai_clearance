"use client";

import { usePathname } from "next/navigation";
import { MediaBuyerProfileMenu } from "@/components/media-buyer/MediaBuyerProfileMenu";

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/media-buyer/users")) {
    return "Media Buyer Users";
  }
  if (
    pathname.startsWith("/media-buyer/brands") ||
    pathname.startsWith("/media-buyer/brand-setup")
  ) {
    return "Brand Setup";
  }
  return "Brand Setup";
}

export function MediaBuyerHeader() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 hidden md:flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-6 shadow-xs">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-gray-900 tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center pl-2">
          <MediaBuyerProfileMenu />
        </div>
      </div>
    </header>
  );
}
