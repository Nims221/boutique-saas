import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

type UserRole = "admin" | "manager" | "seller";

function getSecretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    "10fa7f5aaa3f752a83f8491230fc692e7341601a60f292f6dea95b909c89c9b6";

  return new TextEncoder().encode(secret);
}

const routeRoles: Record<string, UserRole[]> = {
  "/dashboard": ["admin", "seller", "manager"],
  "/ventes": ["admin", "seller", "manager"],
  "/stock": ["admin", "seller", "manager"],
  "/produits": ["admin", "seller", "manager"],
  "/reappro": ["admin", "seller", "manager"],
  "/utilisateurs": ["admin"],
};

function getAllowedRoles(pathname: string) {
  for (const route of Object.keys(routeRoles)) {
    if (pathname.startsWith(route)) {
      return routeRoles[route];
    }
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const token = req.cookies.get("boutique_session")?.value;

  if (pathname === "/login") {
    if (!token) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    try {
      await jwtVerify(token, getSecretKey());
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  const allowedRoles = getAllowedRoles(pathname);

  if (!allowedRoles) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const role = String(payload.role) as UserRole;

    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};