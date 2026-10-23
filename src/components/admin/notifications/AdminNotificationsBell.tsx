"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  NotificationItem,
  NotificationSummary,
  fetchNotificationsApi,
  fetchNotificationDetailsApi,
} from "@/api/admin";
import {
  activeNotificationTabAtom,
  hasMoreNotificationsAtom,
  isLoadingMoreNotificationsAtom,
  isLoadingNotificationsAtom,
  isNotificationDrawerOpenAtom,
  notificationSummaryAtom,
  notificationsCurrentPageAtom,
  notificationsListAtom,
  notificationsTotalPagesAtom,
  selectedNotificationAtom,
  refreshNotificationsTriggerAtom,
} from "@/store/notifications";
import {
  formatNotificationTime,
  getCategoryBadgeClass,
  getPriorityBadgeClass,
  getStatusBadgeClass,
} from "@/lib/notification-utils";
import { useNotificationWebSocket } from "@/hooks/useNotificationWebSocket";

const PAGE_SIZE = 10;

export function AdminNotificationsBell() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useAtom(activeNotificationTabAtom);
  const [notifications, setNotifications] = useAtom(notificationsListAtom);
  const [summary, setSummary] = useAtom(notificationSummaryAtom);
  const [hasMore, setHasMore] = useAtom(hasMoreNotificationsAtom);
  const [currentPage, setCurrentPage] = useAtom(notificationsCurrentPageAtom);
  const [totalPages, setTotalPages] = useAtom(notificationsTotalPagesAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingNotificationsAtom);
  const [isLoadingMore, setIsLoadingMore] = useAtom(isLoadingMoreNotificationsAtom);
  const [refreshTrigger] = useAtom(refreshNotificationsTriggerAtom);

  const setSelectedNotification = useSetAtom(selectedNotificationAtom);
  const setIsDrawerOpen = useSetAtom(isNotificationDrawerOpenAtom);

  const containerRef = useRef<HTMLDivElement>(null);

  // Parse API response
  const parseNotificationsResponse = (res: any) => {
    const payload = res?.data ?? res;
    const items: NotificationItem[] =
      payload?.notifications ??
      payload?.items ??
      (Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : []);

    const rawSummary = payload?.summary ?? res?.summary;
    const parsedSummary: NotificationSummary = {
      unread_count:
        rawSummary?.unread_count ??
        rawSummary?.OPEN ??
        items.filter((i) => i.status === "OPEN").length,
      pending_count:
        rawSummary?.pending_count ??
        rawSummary?.unread_count ??
        rawSummary?.OPEN ??
        0,
      total: rawSummary?.total ?? payload?.total ?? items.length,
      OPEN:
        rawSummary?.OPEN ??
        rawSummary?.unread_count ??
        items.filter((i) => i.status === "OPEN").length,
      REVIEWED: rawSummary?.REVIEWED,
      RESOLVED: rawSummary?.RESOLVED,
    };

    const parsedHasMore =
      payload?.has_more ??
      res?.has_more ??
      (payload?.page != null && payload?.total_pages != null
        ? payload.page < payload.total_pages
        : false);

    const parsedTotalPages =
      payload?.total_pages ?? res?.total_pages ?? (parsedHasMore ? 2 : 1);

    return {
      items,
      summary: parsedSummary,
      hasMore: parsedHasMore,
      totalPages: parsedTotalPages,
    };
  };

  // Fetch initial notifications for the given tab
  const fetchTabNotifications = useCallback(
    async (tab: "ALL" | "UNREAD") => {
      try {
        setIsLoading(true);
        setCurrentPage(1);

        const params: {
          page: number;
          page_size: number;
          status?: "OPEN";
        } = {
          page: 1,
          page_size: PAGE_SIZE,
          ...(tab === "UNREAD" ? { status: "OPEN" } : {}),
        };

        const res = await fetchNotificationsApi(params)();
        const { items, summary: newSummary, hasMore: newHasMore, totalPages: newTotalPages } =
          parseNotificationsResponse(res);

        setNotifications(items);
        setSummary(newSummary);
        setHasMore(newHasMore);
        setTotalPages(newTotalPages);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [setCurrentPage, setHasMore, setIsLoading, setNotifications, setSummary, setTotalPages]
  );

  // Fetch summary counts (for initial bell badge without opening dropdown)
  const fetchSummaryOnly = useCallback(async () => {
    try {
      const res = await fetchNotificationsApi({ page: 1, page_size: 1 })();
      const { summary: newSummary } = parseNotificationsResponse(res);
      setSummary(newSummary);
    } catch (err) {
      console.error("Failed to fetch notifications summary:", err);
    }
  }, [setSummary]);

  // Initial summary load
  useEffect(() => {
    fetchSummaryOnly();
  }, [fetchSummaryOnly]);

  // Refresh notifications when trigger changes (e.g. status updated in drawer)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchTabNotifications(activeTab);
    }
  }, [refreshTrigger, activeTab, fetchTabNotifications]);

  // Connect Real-Time WebSocket for NOTIFICATION_CREATED events
  useNotificationWebSocket();

  // Close dropdown on click outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        containerRef.current &&
        target &&
        containerRef.current.contains(target)
      ) {
        return;
      }
      setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isDropdownOpen]);

  // Toggle Dropdown
  const handleBellClick = () => {
    const nextState = !isDropdownOpen;
    setIsDropdownOpen(nextState);
    if (nextState) {
      fetchTabNotifications(activeTab);
    }
  };

  // Switch Tabs: "ALL" vs "UNREAD"
  const handleTabChange = (tab: "ALL" | "UNREAD") => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    fetchTabNotifications(tab);
  };

  // Load More Notifications
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      const params: {
        page: number;
        page_size: number;
        status?: "OPEN";
      } = {
        page: nextPage,
        page_size: PAGE_SIZE,
        ...(activeTab === "UNREAD" ? { status: "OPEN" } : {}),
      };

      const res = await fetchNotificationsApi(params)();
      const { items: newItems, hasMore: newHasMore, totalPages: newTotalPages } =
        parseNotificationsResponse(res);

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const filteredNew = newItems.filter((i) => !existingIds.has(i.id));
        return [...prev, ...filteredNew];
      });

      setCurrentPage(nextPage);
      setHasMore(newHasMore);
      setTotalPages(newTotalPages);
    } catch (err) {
      console.error("Failed to load more notifications:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Notification Item Click (Auto-Review on Click)
  const handleNotificationClick = async (item: NotificationItem) => {
    const wasOpen = item.status === "OPEN";

    // 1. Auto-Review on Click: Immediately mark as REVIEWED in local UI
    // Decrement navbar bell badge count
    if (wasOpen) {
      const updatedItem: NotificationItem = {
        ...item,
        status: "REVIEWED",
      };
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? updatedItem : n))
      );
      setSummary((prev) => {
        const nextUnread = Math.max(0, (prev.unread_count ?? prev.OPEN ?? 1) - 1);
        return {
          ...prev,
          unread_count: nextUnread,
          OPEN: nextUnread,
        };
      });
      setSelectedNotification(updatedItem);
    } else {
      setSelectedNotification(item);
    }

    // Open detail drawer
    setIsDrawerOpen(true);

    // 2. Call 13.2 Get Notification Details API
    // On the backend, opening an unread (OPEN) notification automatically transitions it to REVIEWED
    try {
      const res = await fetchNotificationDetailsApi(item.id)();
      const detail = res?.data ?? res;
      if (detail && detail.id) {
        setSelectedNotification(detail);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, ...detail } : n))
        );
      }
    } catch (err) {
      console.error("Failed to fetch notification details:", err);
    }
  };

  const unreadCount = summary?.unread_count ?? summary?.OPEN ?? 0;

  return (
    <>
      <div className="relative inline-block" ref={containerRef}>
        {/* Bell Button */}
        <button
          type="button"
          onClick={handleBellClick}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="View notifications"
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 ${
            isDropdownOpen
              ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Bell className="h-5 w-5" />

          {/* Unread Badge (summary.unread_count or summary.OPEN) */}
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white shadow-sm transition-transform duration-150 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel / Dropdown */}
        {isDropdownOpen && (
          <div
            className="absolute right-0 top-12 z-50 w-[380px] sm:w-[440px] max-w-[calc(100vw-24px)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {summary?.total != null && summary.total > 0 && (
                <span className="text-xs font-medium text-gray-400">
                  {summary.total} total
                </span>
              )}
            </div>

            {/* Tabs: All vs Unread */}
            <div className="flex border-b border-gray-100 bg-slate-50/80 px-4">
              <button
                type="button"
                onClick={() => handleTabChange("ALL")}
                className={`relative px-4 py-3 text-xs font-semibold transition-colors ${
                  activeTab === "ALL"
                    ? "text-gray-900 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                All
                {summary?.total != null && (
                  <span className="ml-1.5 text-[11px] font-normal text-gray-400">
                    ({summary.total})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("UNREAD")}
                className={`relative px-4 py-3 text-xs font-semibold transition-colors ${
                  activeTab === "UNREAD"
                    ? "text-gray-900 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Notification Items List */}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                  <span className="text-xs">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-3">
                    <CheckCheck className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {activeTab === "UNREAD"
                      ? "All caught up!"
                      : "No notifications"}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs">
                    {activeTab === "UNREAD"
                      ? "There are no unread (OPEN) notifications to review."
                      : "No system alerts or review requests at this time."}
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isOpen = item.status === "OPEN";
                  const isHigh = item.priority === "HIGH";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group flex items-start gap-3 px-5 py-3.5 transition-colors cursor-pointer ${
                        isOpen
                          ? "bg-blue-50/30 hover:bg-blue-50/60"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {/* Unread (OPEN) Indicator Dot */}
                      <div className="pt-1.5 flex-shrink-0">
                        <span
                          className={`block h-2 w-2 rounded-full transition-all ${
                            isOpen
                              ? "bg-blue-600 ring-4 ring-blue-100"
                              : "bg-transparent"
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4
                            className={`truncate text-xs ${
                              isOpen
                                ? "font-bold text-gray-900"
                                : "font-semibold text-gray-700"
                            }`}
                          >
                            {item.title}
                          </h4>
                          <span className="flex-shrink-0 text-[11px] text-gray-400 whitespace-nowrap">
                            {formatNotificationTime(item.created_at, item.time)}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 leading-snug">
                          {item.message}
                        </p>

                        {/* Pills */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${getPriorityBadgeClass(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>

                          {item.category && (
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold border uppercase tracking-wider ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {item.category.replace(/_/g, " ")}
                            </span>
                          )}

                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Load More Button */}
            {!isLoading && notifications.length > 0 && (
              <button
                type="button"
                disabled={!hasMore || isLoadingMore}
                onClick={handleLoadMore}
                className="w-full border-t border-gray-100 bg-white px-4 py-3 text-center text-xs font-bold transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-blue-600 hover:bg-gray-50 hover:text-blue-700 flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>Loading more notifications...</span>
                  </>
                ) : hasMore ? (
                  "Load More"
                ) : (
                  <span className="text-gray-400 font-medium">
                    ✓ All {notifications.length} notifications loaded
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
