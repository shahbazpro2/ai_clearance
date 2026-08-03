import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

export interface Channel {
  channel_id: string;
  channel_type: string;
  name: string;
  status: string;
}

export interface Audience {
  audience_id: string;
  channels: Channel[];
  is_live: boolean;
  name: string;
  status: string;
}

export interface FinanceAudiencesResponse {
  account_id: string;
  account_name: string;
  audiences: Audience[];
  message: string;
  status: string;
}

export interface OrderRecord {
  order_date: string;
  order: string;
  advertiser: string;
  audience: string;
  channel: string;
  booking_month: string;
  qty_booked: number;
  pacing: string | number;
  qty_distributed_manual: number;
  qty_distributed_rfid: number;
  cpm: number;
  total: number;
  projected_payment_date: string;
  payment_status: string;
  order_cancelled: string | boolean;
}

export interface OrdersPagination {
  page: number;
  page_size: number;
  total_orders: number;
  total_pages: number;
  returned_orders: number;
  scope: string;
  has_next: boolean;
  has_previous: boolean;
}

export interface OrdersResponse {
  orders: OrderRecord[];
  pagination: OrdersPagination;
  sort_by?: string;
  sort_order?: string;
  message?: string;
  status?: string;
}

export interface PaymentOrderRecord {
  order: string;
  advertiser: string;
  audience: string;
  channel: string;
  booking_month: string;
  qty_booked: number;
  cpm: number;
  total: number;
}

export interface PaymentGroup {
  paid_date: string | null;
  is_paid: boolean;
  headline: string;
  order_count: number;
  orders: PaymentOrderRecord[];
}

export interface PaymentsPagination {
  page: number;
  page_size: number;
  total_groups: number;
  total_pages: number;
  returned_groups: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaymentsResponse {
  groups: PaymentGroup[];
  pagination: PaymentsPagination;
  message?: string;
  status?: string;
}

export const fetchFinanceAudiencesApi = () => {
  return universalApi("/finance/audiences", "get");
};

export const retrieveOrdersApi = (payload: {
  channel_ids: string[];
  sort_by?: string;
  sort_order?: string;
  page: number;
  page_size: number;
}) => {
  return universalApi("/finance/orders", "post", payload);
};

export const fetchPaymentsApi = (payload: {
  channel_ids: string[];
  page: number;
  page_size: number;
}) => {
  return universalApi("/finance/payments", "post", payload);
};
