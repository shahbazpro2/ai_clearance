"use client";

export type RetailerStatus = "active" | "inactive";
export type UserStatus = "active" | "inactive";

export interface RetailerUser {
  contact_id: string;
  name: string;
  email: string;
  status: UserStatus;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryUser {
  name?: string;
  first_name?: string;
  last_name?: string;
  FirstName?: string;
  LastName?: string;
  email?: string;
  Email?: string;
  phone?: string;
  Phone?: string;
  status?: string;
  updated_at?: string;
}

export interface DistributionCenter {
  distribution_center_id?: string;
  distribution_center_salesforce_id?: string | null;
  name?: string;
  distribution_center_name?: string;
  status?: string;
  allocation_percentage?: number | string | null;
  ship_to_name?: string;
  shipping_address_1?: string;
  shipping_address_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  shipping_instructions?: string;
  updated_at?: string;
  inventory_user?: InventoryUser | null;
  inventoryUser?: InventoryUser | null;
  inventory_contact?: InventoryUser | null;
}

export interface Channel {
  channel_id: string;
  name: string;
  status: RetailerStatus;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  distribution_centers?: DistributionCenter[];
}

export interface Audience {
  audience_id: string;
  name: string;
  status: RetailerStatus;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  channels: Channel[];
}

export interface RetailerAccount {
  account_id: string;
  account_name: string;
  status: RetailerStatus;
  users: RetailerUser[];
  audiences: Audience[];
  created_at: string;
  updated_at: string;
}
