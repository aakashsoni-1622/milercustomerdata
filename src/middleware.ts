import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getCurrentUser,
  isPublicRoute,
  isProtectedRoute,
  hasRoutePermission,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    const user = await getCurrentUser(request);

    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based permissions
    if (!hasRoutePermission(pathname, user.role)) {
      // Redirect to unauthorized page or home
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
