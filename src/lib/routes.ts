// Route configuration
export const ROUTES = {
  // Routes that require authentication
  PROTECTED: ["/", "/create-campaign", "/campaigns"],

  ADMIN: [
    "/admin",
    "/admin/manual-reviews",
    "/admin/manual-availability-reviews",
    "/admin/challenged-reviews",
    "/admin/approve-reviews",
    "/admin/deny-reviews",
    "/admin/users",
  ],

  // Routes that should redirect authenticated users to dashboard
  AUTH: [
    "/login",
    "/admin/login",
    "/signup",
    "/admin/signup",
    "/verify-otp",
    "/forgot-password",
  ],
  PUBLIC: ["/payment/success"],
} as const;
