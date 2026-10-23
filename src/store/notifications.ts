import { atom } from "jotai";
import { NotificationItem, NotificationSummary } from "@/api/admin";

export const initialNotificationSummary: NotificationSummary = {
  unread_count: 0,
  pending_count: 0,
  total: 0,
  OPEN: 0,
};

export const notificationSummaryAtom = atom<NotificationSummary>(initialNotificationSummary);
export const activeNotificationTabAtom = atom<"ALL" | "UNREAD">("ALL");
export const notificationsListAtom = atom<NotificationItem[]>([]);
export const selectedNotificationAtom = atom<NotificationItem | null>(null);
export const isNotificationDrawerOpenAtom = atom<boolean>(false);
export const hasMoreNotificationsAtom = atom<boolean>(false);
export const notificationsCurrentPageAtom = atom<number>(1);
export const notificationsTotalPagesAtom = atom<number>(1);
export const isLoadingNotificationsAtom = atom<boolean>(false);
export const isLoadingMoreNotificationsAtom = atom<boolean>(false);
export const refreshNotificationsTriggerAtom = atom<number>(0);

