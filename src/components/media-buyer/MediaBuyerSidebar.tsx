"use client";

import { Users } from "lucide-react";
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

  const userName =
    userData?.name ||
    userData?.username ||
    userData?.email?.split("@")[0] ||
    "Media Buyer";

  const userInitials = userName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <PortalSidebar
      collapsed={collapsed}
      homeHref="/media-buyer/users"
      items={items}
      mobileOpen={mobileOpen}
      onCollapsedChange={setCollapsed}
      onMobileOpenChange={setMobileOpen}
      portalName="Media Buyer Portal"
      showLogout={false}
      userProfile={{
        avatarUrl: userData?.avatar || userData?.profile_picture,
        initials: userInitials || "MB",
        name: userName,
      }}
      headerRight={
        <div className="flex items-center gap-2">
          <MediaBuyerProfileMenu />
        </div>
      }
    />
  );
}
