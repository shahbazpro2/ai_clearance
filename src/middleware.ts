import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROUTES } from "./lib/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Backwards compatibility: redirect legacy /inventory-portal paths to /inventory
  if (pathname === "/inventory-portal" || pathname.startsWith("/inventory-portal/")) {
    const newPath = pathname.replace(/^\/inventory-portal/, "/inventory");
    const redirectUrl = new URL(newPath, request.url);
    request.nextUrl.searchParams.forEach((val, key) => redirectUrl.searchParams.set(key, val));
    return NextResponse.redirect(redirectUrl);
  }

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isFinancePath = pathname === "/finance" || pathname.startsWith("/finance/");
  const isRetailerPath = pathname === "/retailer" || pathname.startsWith("/retailer/");
  const isInventoryPath = pathname === "/inventory" || pathname.startsWith("/inventory/");
  const isMediaBuyerPath = pathname === "/media-buyer" || pathname.startsWith("/media-buyer/");
  const roleQuery = request.nextUrl.searchParams.get("role");
  const isAdminRoleQuery = roleQuery === "admin" || roleQuery === "super_admin";
  const isMediaBuyerRoleQuery = roleQuery === "media_buyer_admin" || roleQuery === "media_buyer_standard";
  const isAdminContext = isAdminPath || isAdminRoleQuery;
  const isMediaBuyerContext = isMediaBuyerPath || isMediaBuyerRoleQuery;

  // Debug logging
  console.log("🔍 Middleware executing for:", pathname);

  // Get access token from cookies
  const accessToken = (await cookies()).get("access_token")?.value;
  console.log("🔑 Access token:", accessToken);
  console.log("🔑 Token status:", accessToken ? "Found" : "Not found");

  const isPublicRoute = ROUTES.PUBLIC.includes(pathname as any);

  if (isPublicRoute) {
    console.log("✅ Public route, allowing access:", pathname);
    return NextResponse.next();
  }

  // Check if current path is an auth route (login, signup, etc.)
  const isAuthRoute = ROUTES.AUTH.includes(pathname as any);

  // Check protected routes - AUTH routes are never protected
  const isFinanceProtectedRoute =
    !isAuthRoute &&
    ROUTES.FINANCE.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  const isRetailerProtectedRoute =
    !isAuthRoute &&
    ROUTES.RETAILER.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  const isAdminProtectedRoute =
    !isAuthRoute &&
    ROUTES.ADMIN.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  const isInventoryProtectedRoute =
    !isAuthRoute &&
    ROUTES.INVENTORY.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  const isMediaBuyerProtectedRoute =
    !isAuthRoute &&
    ROUTES.MEDIA_BUYER.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

  const anyProtected =
    isFinanceProtectedRoute ||
    isRetailerProtectedRoute ||
    isAdminProtectedRoute ||
    isInventoryProtectedRoute ||
    isMediaBuyerProtectedRoute;

  // Redirect unauthenticated users from protected routes to respective login pages
  if (anyProtected && !accessToken) {
    console.log("🚫 Redirecting to login from protected route:", pathname);
    const targetUrl = request.nextUrl.search ? `${pathname}${request.nextUrl.search}` : pathname;
    if (isInventoryProtectedRoute) {
      const loginUrl = new URL("/inventory/login", request.url);
      loginUrl.searchParams.set("redirect", targetUrl);
      return NextResponse.redirect(loginUrl);
    }
    if (isMediaBuyerProtectedRoute) {
      const loginUrl = new URL("/media-buyer/login", request.url);
      loginUrl.searchParams.set("redirect", targetUrl);
      return NextResponse.redirect(loginUrl);
    }
    if (isFinanceProtectedRoute) {
      const loginUrl = new URL("/finance/login", request.url);
      loginUrl.searchParams.set("redirect", targetUrl);
      return NextResponse.redirect(loginUrl);
    }
    if (isAdminProtectedRoute) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", targetUrl);
      return NextResponse.redirect(loginUrl);
    }
    if (isRetailerProtectedRoute) {
      const loginUrl = new URL("/retailer/login", request.url);
      loginUrl.searchParams.set("redirect", targetUrl);
      return NextResponse.redirect(loginUrl);
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", targetUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard based on role context
  if (isAuthRoute && accessToken) {
    console.log("✅ Redirecting to dashboard from auth route:", pathname);
    const requestedRedirect = request.nextUrl.searchParams.get("redirect");
    if (requestedRedirect && requestedRedirect.startsWith("/")) {
      return NextResponse.redirect(new URL(requestedRedirect, request.url));
    }
    const authRole = (await cookies()).get("auth_role")?.value?.toLowerCase();
    let redirectPath = "/retailer/audiences/setup/step";
    if (pathname === "/admin/login" || isAdminContext) {
      redirectPath = "/admin";
    } else if (pathname === "/media-buyer/login" || isMediaBuyerContext) {
      redirectPath = "/media-buyer/brands";
    } else if (pathname === "/finance/login" || isFinancePath || roleQuery === "finance") {
      redirectPath = "/finance";
    } else if (pathname === "/retailer/login" || isRetailerPath || roleQuery === "retailer") {
      redirectPath = "/retailer/audiences/setup/step";
    } else if (pathname === "/inventory/login" || isInventoryPath || roleQuery === "inventory") {
      redirectPath = "/inventory";
    } else if (authRole === "admin" || authRole === "super_admin") {
      redirectPath = "/admin";
    } else if (authRole === "media_buyer_admin" || authRole === "media_buyer_standard") {
      redirectPath = "/media-buyer/brands";
    } else if (authRole === "finance") {
      redirectPath = "/finance";
    } else if (authRole === "inventory") {
      redirectPath = "/inventory";
    } else if (authRole === "retailer" || authRole === "setup_user") {
      redirectPath = "/retailer/audiences/setup/step";
    }
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
