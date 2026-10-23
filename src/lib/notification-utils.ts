import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
} from "@/api/admin";

export function formatNotificationTime(created_at?: string, time?: string): string {
  if (time) {
    return time.includes("ago") ? time : `${time} ago`;
  }
  if (!created_at) return "";

  try {
    const date = new Date(created_at);
    if (isNaN(date.getTime())) return created_at;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "just now";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return created_at;
  }
}

/**
 * State Machine Transitions:
 * - From OPEN → can be marked as REVIEWED or RESOLVED.
 * - From REVIEWED → can be marked as RESOLVED or reopened as OPEN.
 * - From RESOLVED → can only be reopened as OPEN (direct transition to REVIEWED is rejected with 409 Conflict).
 *
 * Action Required Security Rule:
 * - For notifications where category = "ACTION_REQUIRED", do NOT display a manual "Resolve" button.
 *   These notifications resolve automatically when the Admin approves or rejects the request in the review workflow.
 */
export function getAllowedTransitions(
  currentStatus: NotificationStatus,
  category: NotificationCategory
): NotificationStatus[] {
  const isActionRequired = category === "ACTION_REQUIRED";

  switch (currentStatus) {
    case "OPEN":
      return isActionRequired ? ["REVIEWED"] : ["REVIEWED", "RESOLVED"];
    case "REVIEWED":
      return isActionRequired ? ["OPEN"] : ["RESOLVED", "OPEN"];
    case "RESOLVED":
      return ["OPEN"];
    default:
      return [];
  }
}

export function getPriorityBadgeClass(priority: NotificationPriority): string {
  switch (priority) {
    case "HIGH":
      return "bg-red-50 text-red-700 border-red-200/80";
    case "MID":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "LOW":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function getStatusBadgeClass(status: NotificationStatus): string {
  switch (status) {
    case "OPEN":
      return "bg-red-50 text-red-600 border-red-200";
    case "REVIEWED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getCategoryBadgeClass(category: NotificationCategory): string {
  switch (category) {
    case "ACTION_REQUIRED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "SYSTEM_ERROR":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "INFORMATIONAL":
      return "bg-slate-50 text-slate-600 border-slate-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}
