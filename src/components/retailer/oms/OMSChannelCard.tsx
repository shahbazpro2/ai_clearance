"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Channel, DistributionCenter, isOmsTestingCompleted } from "@/components/retailer/oms/types";

interface OMSChannelCardProps {
  channel: Channel;
  onViewShipmentLogs: (dc: DistributionCenter) => void;
}

export function OMSChannelCard({ channel, onViewShipmentLogs }: OMSChannelCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900">{channel.channel_name}</h3>
            <Badge className="bg-green-100 text-green-700">
              {channel.status.charAt(0).toUpperCase() + channel.status.slice(1)}
            </Badge>
            <Badge
              className={
                channel.oms_feed_received
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }
            >
              OMS Testing: {channel.oms_feed_received ? "Completed" : "Remaining"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-6 py-3">Distribution Center</th>
              <th className="px-6 py-3">OMS Testing</th>
              <th className="px-6 py-3">Allocation %</th>
              <th className="px-6 py-3">City</th>
              <th className="px-6 py-3">State</th>
              <th className="px-6 py-3">Ship To Name</th>
              <th className="px-6 py-3">Shipping Address</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {channel.distribution_centers.map((dc) => {
              const isCompleted = isOmsTestingCompleted(dc);

              return (
                <tr key={dc.distribution_center_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {dc.distribution_center_name}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={
                        isCompleted
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {isCompleted ? "Completed" : "Remaining"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{dc.allocation_percentage}%</td>
                  <td className="px-6 py-4 text-gray-700">{dc.city}</td>
                  <td className="px-6 py-4 text-gray-700">{dc.state}</td>
                  <td className="px-6 py-4 text-gray-700">{dc.ship_to_name}</td>
                  <td className="px-6 py-4 text-gray-700">
                    <div>
                      {dc.shipping_address_1}
                      {dc.shipping_address_2 && (
                        <div className="text-gray-500">{dc.shipping_address_2}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isCompleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewShipmentLogs(dc)}
                      >
                        View Shipment Logs
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">
                        No actions available
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
