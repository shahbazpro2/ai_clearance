export interface DistributionCenter {
  allocation_percentage: number;
  city: string;
  country_code: string;
  distribution_center_id: string;
  distribution_center_name: string;
  oms_feed_received: boolean;
  oms_record_count: number;
  ship_to_name: string;
  shipping_address_1: string;
  shipping_address_2: string;
  state: string;
  status: string;
  zip_code: string;
}

export interface Channel {
  channel_id: string;
  channel_name: string;
  distribution_centers: DistributionCenter[];
  distribution_centers_count: number;
  oms_feed_received: boolean;
  status: string;
}

export interface OMSAudienceDetailsData {
  all_oms_feed_received: boolean;
  audience_id: string;
  channels: Channel[];
  channels_count: number;
  local_audience_id: string;
}

export interface ShipmentLog {
  received_at: string;
  shipment_date: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface ShipmentLogsResponse {
  distribution_center_id: string;
  distribution_center_name: string;
  logs: ShipmentLog[];
  message: string;
  status: string;
  total_records: number;
}

export function isOmsTestingCompleted(dc: DistributionCenter) {
  return dc.oms_feed_received || dc.status?.toLowerCase() === "completed";
}
