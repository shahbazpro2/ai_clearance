import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROUTES } from "./lib/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug logging
  console.log("🔍 Middleware executing for:", pathname);

  // Get access token from cookies
  const accessToken = (await cookies()).get("access_token")?.value;
  console.log("🔑 Access token:", accessToken);
  /*  if (accessToken) {
    Axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  } */
  console.log("🔑 Token status:", accessToken ? "Found" : "Not found");

  // Check if current path is protected
  const isProtectedRoute = ROUTES.PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an auth route
  const isAuthRoute = ROUTES.AUTH.includes(pathname as any);

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !accessToken) {
    console.log("🚫 Redirecting to login from protected route:", pathname);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
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

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && accessToken) {
    console.log("✅ Redirecting to dashboard from auth route:", pathname);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
