// Route configuration
export const ROUTES = {
  // Routes that require authentication
  ADMIN: ["/admin"],

  RETAILER: [
    "/retailer",
    "/retailer/block-categories",
    "/retailer/brand-approval-settings",
    "/retailer/audiences/setup/step",
  ],

  FINANCE: [
    "/finance",
  ],

  INVENTORY: [
    "/inventory",
  ],
  INVENTORY_PORTAL: [
    "/inventory",
    "/inventory-portal",
  ],

  // Routes that should redirect authenticated users to dashboard
  AUTH: [
    "/login",
    "/retailer/login",
    "/admin/login",
    "/finance/login",
    "/inventory/login",
    "/inventory-portal/login",
    "/signup",
    "/admin/signup",
    "/verify-otp",
    "/forgot-password",
    "/inventory/forgot-password",
    "/inventory-portal/forgot-password",
  ],
  PUBLIC: [] as readonly string[],
} as const;
