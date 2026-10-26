"use client";

import { useEffect, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import { getAccessToken } from "@/lib/auth";
import {
  notificationsListAtom,
  notificationSummaryAtom,
} from "@/store/notifications";
import { NotificationItem } from "@/api/admin";
import { toast } from "react-toastify";

export function getNotificationsWebSocketUrl(token: string): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    const base = process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, "");
    return `${base}/admin/notifications/ws?token=${encodeURIComponent(token)}`;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (apiUrl) {
    // If it's a remote URL (e.g. http://34.170.242.60:8080)
    const wsBase = apiUrl
      .replace(/^http:\/\//i, "ws://")
      .replace(/^https:\/\//i, "wss://")
      .replace(/\/$/, "");
    return `${wsBase}/admin/notifications/ws?token=${encodeURIComponent(token)}`;
  }
  return `ws://localhost:8000/admin/notifications/ws?token=${encodeURIComponent(token)}`;
}

// Global state to prevent duplicate connections across multiple component instances
let activeSocket: WebSocket | null = null;
let subscribersCount = 0;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let isIntentionalClose = false;
const eventListeners = new Set<(notification: NotificationItem) => void>();

function notifyListeners(notification: NotificationItem) {
  eventListeners.forEach((listener) => {
    try {
      listener(notification);
    } catch (e) {
      console.error("Error in notification WS listener:", e);
    }
  });
}

function connectWebSocket() {
  if (typeof window === "undefined") return;

  const token = getAccessToken();
  if (!token) return;

  if (
    activeSocket &&
    (activeSocket.readyState === WebSocket.OPEN ||
      activeSocket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  try {
    const wsUrl = getNotificationsWebSocketUrl(token);
    const ws = new WebSocket(wsUrl);
    activeSocket = ws;
    isIntentionalClose = false;

    ws.onopen = () => {
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const raw =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        const eventType = raw?.event || raw?.type || raw?.event_type;

        if (eventType === "NOTIFICATION_CREATED" || raw?.title) {
          const notification: NotificationItem =
            raw?.data || raw?.notification || raw?.payload || raw;
          if (notification && (notification.id || notification.title)) {
            notifyListeners(notification);
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket notification event:", err);
      }
    };

    ws.onclose = (event) => {
      activeSocket = null;

      // 1008 Policy Violation indicates authentication failed
      if (event.code === 1008) {
        console.warn(
          "WebSocket closed: 1008 Policy Violation (Invalid Token). Reconnection halted.",
        );
        return;
      }

      if (isIntentionalClose || subscribersCount <= 0) {
        return;
      }

      // Exponential backoff reconnection, max 30s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts += 1;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        connectWebSocket();
      }, delay);
    };

    ws.onerror = (error) => {
      // Browser WebSocket errors don't provide details; fallback to REST smoothly
      console.warn(
        "WebSocket error encountered (falling back to REST API):",
        error,
      );
    };
  } catch (err) {
    console.warn(
      "Failed to instantiate WebSocket (falling back to REST API):",
      err,
    );
  }
}

function disconnectWebSocket() {
  if (subscribersCount <= 0) {
    isIntentionalClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
    reconnectAttempts = 0;
  }
}

export function useNotificationWebSocket(options?: {
  onNotificationCreated?: (notification: NotificationItem) => void;
}) {
  const setSummary = useSetAtom(notificationSummaryAtom);
  const setNotifications = useSetAtom(notificationsListAtom);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleCreated = (notification: NotificationItem) => {
      // 1. Increment Navbar Bell unread badge (summary.unread_count + 1)
      setSummary((prev) => {
        const currentUnread = prev.unread_count ?? prev.OPEN ?? 0;
        const currentTotal = prev.total ?? 0;
        return {
          ...prev,
          unread_count: currentUnread + 1,
          OPEN: currentUnread + 1,
          total: currentTotal + 1,
        };
      });

      // 2. Prepend the notification to the active list without reloading the page
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id);
        if (exists) {
          return prev.map((n) => (n.id === notification.id ? notification : n));
        }
        return [notification, ...prev];
      });

      optionsRef.current?.onNotificationCreated?.(notification);
    };

    eventListeners.add(handleCreated);
    subscribersCount += 1;

    if (subscribersCount === 1) {
      connectWebSocket();
    }

    return () => {
      eventListeners.delete(handleCreated);
      subscribersCount -= 1;
      if (subscribersCount <= 0) {
        disconnectWebSocket();
      }
    };
  }, [setNotifications, setSummary]);
}
