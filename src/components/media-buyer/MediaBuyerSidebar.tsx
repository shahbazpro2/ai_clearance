"use client";

import { Globe, Users, Layers } from "lucide-react";
import { useAtom } from "jotai";
import { PortalSidebar, type PortalSidebarItem } from "@/components/common/PortalSidebar";
import { useMe } from "@/hooks/useMe";
import {
  mediaBuyerMobileSidebarOpenAtom,
  mediaBuyerSidebarCollapsedAtom,
} from "@/store/ui";
import { MediaBuyerProfileMenu } from "@/components/media-buyer/MediaBuyerProfileMenu";

export function MediaBuyerSidebar() {
  const [collapsed, setCollapsed] = useAtom(mediaBuyerSidebarCollapsedAtom);
  const [mobileOpen, setMobileOpen] = useAtom(mediaBuyerMobileSidebarOpenAtom);
  const userData = useMe();

  const isMediaBuyerAdmin = userData?.role === "media_buyer_admin";

  const items: PortalSidebarItem[] = [
    {
      title: "Brand Setup",
      href: "/media-buyer/brands",
      icon: Globe,
    },
    {
      title: "Insert Version Setup",
      href: "/media-buyer/insert-versions",
      icon: Layers,
    },
    ...(isMediaBuyerAdmin
      ? [
          {
            title: "Media Buyer Users",
            href: "/media-buyer/users",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <PortalSidebar
      collapsed={collapsed}
      homeHref="/media-buyer/brands"
      items={items}
      mobileOpen={mobileOpen}
      onCollapsedChange={setCollapsed}
      onMobileOpenChange={setMobileOpen}
      portalName="Media Buyer Portal"
      showLogout={false}
      headerRight={
        <div className="flex items-center gap-2">
          <MediaBuyerProfileMenu />
        </div>
      }
    />
  );
}
