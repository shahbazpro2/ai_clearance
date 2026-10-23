"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAtom, useSetAtom } from "jotai";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  NotificationItem,
  NotificationStatus,
  updateNotificationStatusApi,
} from "@/api/admin";
import {
  isNotificationDrawerOpenAtom,
  selectedNotificationAtom,
  notificationsListAtom,
  notificationSummaryAtom,
  refreshNotificationsTriggerAtom,
} from "@/store/notifications";
import {
  formatNotificationTime,
  getAllowedTransitions,
  getCategoryBadgeClass,
  getPriorityBadgeClass,
  getStatusBadgeClass,
} from "@/lib/notification-utils";
import { toast } from "react-toastify";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

interface AdminNotificationDetailsDrawerProps {
  onStatusUpdated?: () => void;
}

export function AdminNotificationDetailsDrawer({
  onStatusUpdated,
}: AdminNotificationDetailsDrawerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isNotificationDrawerOpenAtom);
  const [selectedNotification, setSelectedNotification] = useAtom(
    selectedNotificationAtom
  );
  const setNotifications = useSetAtom(notificationsListAtom);
  const setSummary = useSetAtom(notificationSummaryAtom);
  const setRefreshTrigger = useSetAtom(refreshNotificationsTriggerAtom);

  const [showRawJson, setShowRawJson] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!selectedNotification) {
    return null;
  }

  const {
    id,
    title,
    message,
    priority,
    category,
    status,
    created_at,
    time,
    action_url,
    error_details,
    technical_info,
  } = selectedNotification;

  const allowedTransitions = getAllowedTransitions(status, category);
  const isActionRequired = category === "ACTION_REQUIRED";
  const rawErrorObj = error_details || technical_info?.raw_json || null;

  const handleUpdateStatus = async (newStatus: NotificationStatus) => {
    if (!allowedTransitions.includes(newStatus)) {
      toast.error(`Transition to ${newStatus} is not supported from ${status}`);
      return;
    }

    try {
      setIsUpdating(true);
      await updateNotificationStatusApi(id, { status: newStatus })();
      toast.success(`Notification status updated to ${newStatus}`);

      // Update local selected state
      const updatedItem: NotificationItem = {
        ...selectedNotification,
        status: newStatus,
      };
      setSelectedNotification(updatedItem);

      // Update local list
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );

      // Adjust summary counts locally
      if (status === "OPEN" && newStatus !== "OPEN") {
        setSummary((prev) => ({
          ...prev,
          unread_count: Math.max(0, (prev.unread_count || 1) - 1),
          OPEN: Math.max(0, ((prev.OPEN ?? prev.unread_count) || 1) - 1),
        }));
      } else if (status !== "OPEN" && newStatus === "OPEN") {
        setSummary((prev) => ({
          ...prev,
          unread_count: (prev.unread_count || 0) + 1,
          OPEN: ((prev.OPEN ?? prev.unread_count) || 0) + 1,
        }));
      }

      // Notify listeners to refetch
      setRefreshTrigger((prev) => prev + 1);
      onStatusUpdated?.();
    } catch (err: any) {
      console.error("Failed to update notification status:", err);
      const statusCode = err?.response?.status;
      if (statusCode === 409) {
        toast.error("Status conflict (409): direct transition is rejected.");
      } else {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update notification status";
        toast.error(errorMsg);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionClick = () => {
    if (!action_url) return;
    setIsOpen(false);
    router.push(action_url);
  };

  const getActionButtonLabel = () => {
    const lowerTitle = (title || "").toLowerCase();
    if (lowerTitle.includes("projection")) {
      return "Open Monthly Projection Review →";
    }
    if (lowerTitle.includes("distributor")) {
      return "Open Distributor Approval Review →";
    }
    if (lowerTitle.includes("brand")) {
      return "Open Brand Approval Review →";
    }
    return "Open Review Workflow →";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-[520px] max-w-[95vw] sm:max-w-[540px] p-0 flex flex-col bg-white"
        onPointerDownOutside={() => {
          setIsOpen(false);
        }}
        onInteractOutside={() => {
          setIsOpen(false);
        }}
      >
        <div
          className="flex flex-col h-full w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <SheetHeader className="px-6 py-5 border-b border-gray-100 flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
                Notification Details
              </span>
            </div>
            <SheetTitle className="text-lg font-bold text-gray-900 leading-snug">
              {title}
            </SheetTitle>
          </SheetHeader>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/80 border border-slate-100 rounded-xl p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Priority
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getPriorityBadgeClass(
                  priority
                )}`}
              >
                {priority}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Status
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadgeClass(
                  status
                )}`}
              >
                {status}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Category
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getCategoryBadgeClass(
                  category
                )}`}
              >
                {(category || "").replace(/_/g, " ")}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                Created Time
              </span>
              <span className="text-xs font-medium text-gray-700">
                {formatNotificationTime(created_at, time)}
              </span>
            </div>
          </div>

          {/* Incident Message */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Message
            </h4>
            <div className="p-4 bg-white border border-gray-200 rounded-xl text-sm leading-relaxed text-gray-800 whitespace-pre-wrap shadow-sm">
              {message}
            </div>
          </div>

          {/* Action Required Section */}
          {action_url && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                Related Action
              </h4>
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl flex flex-col gap-3">
                <p className="text-xs text-blue-900 leading-normal">
                  This notification references an actionable item in the Admin Portal.
                </p>
                <Button
                  onClick={handleActionClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{getActionButtonLabel()}</span>
                </Button>
              </div>
            </div>
          )}

          {/* System Error Diagnostics */}
          {(category === "SYSTEM_ERROR" || rawErrorObj) && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                System Error Diagnostics
              </h4>
              <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 font-medium block">Status Code:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {rawErrorObj?.status_code ??
                        rawErrorObj?.statusCode ??
                        rawErrorObj?.smtp_code ??
                        "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Exception:</span>
                    <span className="font-mono font-semibold text-rose-700 truncate block">
                      {rawErrorObj?.exception_type ??
                        rawErrorObj?.type ??
                        "SystemError"}
                    </span>
                  </div>
                </div>

                {/* Raw Error JSON Toggle */}
                {rawErrorObj && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowRawJson((prev) => !prev)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2 focus:outline-none"
                    >
                      {showRawJson ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Raw Error JSON</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>+ View Raw Error JSON</span>
                        </>
                      )}
                    </button>
                    {showRawJson && (
                      <pre className="mt-2 p-3 bg-slate-900 text-sky-300 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
                        {JSON.stringify(rawErrorObj, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer (State Machine Actions) */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            {isActionRequired ? (
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Resolves automatically via business review workflow
              </span>
            ) : status === "RESOLVED" ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolved incident
              </span>
            ) : (
              <span>Manual incident resolution available</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Reopen as OPEN (Available when REVIEWED or RESOLVED) */}
            {allowedTransitions.includes("OPEN") && (
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus("OPEN")}
                className="text-xs font-semibold border-gray-300 hover:bg-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reopen as OPEN</span>
              </Button>
            )}

            {/* Mark as REVIEWED (Available when OPEN) */}
            {allowedTransitions.includes("REVIEWED") && (
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus("REVIEWED")}
                className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                {isUpdating ? <LoadingSpinner size="sm" /> : "Mark as Reviewed"}
              </Button>
            )}

            {/* Mark as RESOLVED (Blocked for ACTION_REQUIRED security rule!) */}
            {allowedTransitions.includes("RESOLVED") && (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus("RESOLVED")}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                {isUpdating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Resolved</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
