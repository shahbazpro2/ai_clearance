"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShipmentLogsResponse } from "@/components/retailer/oms/types";

interface OMSShipmentLogsDialogProps {
  data: ShipmentLogsResponse | null;
  error: string | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function OMSShipmentLogsDialog({
  data,
  error,
  loading,
  onOpenChange,
  open,
}: OMSShipmentLogsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl">
        <DialogHeader>
          <DialogTitle>Shipment Logs</DialogTitle>
          <DialogDescription>
            {data
              ? `Showing ${data.total_records} shipment log record${data.total_records === 1 ? "" : "s"} for ${data.distribution_center_name}.`
              : "Review OMS shipment logs for the selected distribution center."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-gray-500">
            <LoadingSpinner size="sm" />
            Loading shipment logs...
          </div>
        ) : error ? (
          <div className="py-8 text-sm text-red-600">{error}</div>
        ) : data?.logs?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Address1</th>
                  <th className="px-4 py-3">Address2</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Zip</th>
                  <th className="px-4 py-3">Shipment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.logs.map((log, index) => (
                  <tr key={`${log.received_at}-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{log.address1 || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{log.address2 || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{log.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{log.state || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{log.zip_code || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{log.shipment_date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-sm text-gray-500">
            No shipment logs found for this distribution center.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
