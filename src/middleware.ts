import { NextRequest, NextResponse } from "next/server";

// Middleware runs in the Edge Runtime (v8 isolate) — Node.js built-ins and
// firebase-admin are not available here.
//
// Strategy: middleware checks cookie *existence* to provide a UX redirect.
// The real cryptographic session verification happens in:
//   - API route handlers (POST /api/auth/session, GET /api/auth/me) via firebase-admin
//   - Firestore Security Rules enforce per-user data isolation server-side
// This is defense-in-depth: middleware keeps unauthenticated users off
// protected pages; the data layer rejects any actual unauthorised access.

const PROTECTED_PATHS = ["/", "/completed", "/archived"];

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through API routes, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Public routes — always accessible
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Protected routes — redirect to /login when session cookie is absent
  if (PROTECTED_PATHS.includes(pathname)) {
    const hasSession = Boolean(req.cookies.get("__session")?.value);
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
