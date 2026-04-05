import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const role = req.auth.user?.role as string | undefined;

  // Player role restrictions
  if (role === "player") {
    // Players can access: check-in, their own player detail, api routes, settings
    const allowed = [
      "/check-in",
      "/settings",
      "/api/",
      "/dashboard", // players can see dashboard (read-only)
    ];

    // Allow player detail for their own profile
    const playerId = (req.auth.user as { playerId?: string })?.playerId;
    if (playerId && pathname.startsWith(`/players/${playerId}`)) {
      return NextResponse.next();
    }

    if (allowed.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    // Block players from staff-only pages
    if (pathname.startsWith("/players") || pathname.startsWith("/wellness") || pathname.startsWith("/workload")) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
