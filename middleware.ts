import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isSameOrigin(url: string, requestUrl: string): boolean {
  try {
    const target = new URL(url, requestUrl);
    const origin = new URL(requestUrl);
    return target.origin === origin.origin;
  } catch {
    return false;
  }
}

export default auth((req: NextRequest & { auth?: unknown }) => {
  const { pathname, searchParams } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const session = (req as { auth?: { user?: unknown } }).auth;
  if (!session) {
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    const loginUrl = new URL("/login", req.url);

    if (callbackUrl !== "/" && isSameOrigin(callbackUrl, req.url)) {
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
    }

    return NextResponse.redirect(loginUrl);
  }

  // Strip open-redirect attempts from callbackUrl after login
  const callbackUrl = searchParams.get("callbackUrl");
  if (callbackUrl && !isSameOrigin(callbackUrl, req.url)) {
    const safeUrl = new URL(req.url);
    safeUrl.searchParams.delete("callbackUrl");
    return NextResponse.redirect(safeUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
