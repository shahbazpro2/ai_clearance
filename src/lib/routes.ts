// Route configuration
export const ROUTES = {
  // Routes that require authentication
  PROTECTED: [
    "/",
    "/create-campaign"
  ],

  // Routes that should redirect authenticated users to dashboard
  AUTH: ["/login", "/signup", "/verify-otp", "/forgot-password"],
} as const;
