import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROUTES } from "./lib/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isFinancePath = pathname === "/finance" || pathname.startsWith("/finance/");
  const isRetailerPath = pathname === "/retailer" || pathname.startsWith("/retailer/");
  const roleQuery = request.nextUrl.searchParams.get("role");
  const isAdminRoleQuery = roleQuery === "admin" || roleQuery === "super_admin";
  const isAdminContext = isAdminPath || isAdminRoleQuery;

  // Debug logging
  console.log("🔍 Middleware executing for:", pathname);

  // Get access token from cookies
  const accessToken = (await cookies()).get("access_token")?.value;
  console.log("🔑 Access token:", accessToken);
  console.log("🔑 Token status:", accessToken ? "Found" : "Not found");

  // Check if current path is protected (general advertiser routes)
  const isProtectedRoute = ROUTES.PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  // Check finance protected routes
  const isFinanceProtectedRoute = ROUTES.FINANCE.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  // Check retailer protected routes
  const isRetailerProtectedRoute = ROUTES.RETAILER.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  // Check admin protected routes
  const isAdminProtectedRoute = ROUTES.ADMIN.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isPublicRoute = ROUTES.PUBLIC.includes(pathname as any);

  if (isPublicRoute) {
    console.log("✅ Public route, allowing access:", pathname);
    return NextResponse.next();
  }

  // Check if current path is an auth route
  const isAuthRoute = ROUTES.AUTH.includes(pathname as any);

  const anyProtected = isProtectedRoute || isFinanceProtectedRoute || isRetailerProtectedRoute || isAdminProtectedRoute;

  // Redirect unauthenticated users from protected routes to login
  if (anyProtected && !accessToken) {
    console.log("🚫 Redirecting to login from protected route:", pathname);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    if (isFinanceProtectedRoute) {
      loginUrl.searchParams.set("role", "finance");
    } else if (isAdminProtectedRoute) {
      loginUrl.searchParams.set("role", "admin");
    } else if (isRetailerProtectedRoute) {
      loginUrl.searchParams.set("role", "retailer");
    }
    return NextResponse.redirect(loginUrl);
  }

  if (
    isProtectedRoute &&
    (await cookies()).get("is_active")?.value === "false" &&
    pathname !== "/plans"
  ) {
    console.log("🚫 Redirecting to plans from protected route:", pathname);
    return NextResponse.redirect(new URL("/plans", request.url));
  }

  // Redirect authenticated users from auth routes to dashboard based on role context
  if (isAuthRoute && accessToken) {
    console.log("✅ Redirecting to dashboard from auth route:", pathname);
    let redirectPath = "/";
    if (isAdminContext) {
      redirectPath = "/admin";
    } else if (isFinancePath || roleQuery === "finance") {
      redirectPath = "/finance";
    } else if (isRetailerPath) {
      redirectPath = "/retailer/block-categories";
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
