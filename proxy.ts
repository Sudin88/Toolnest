import { NextResponse, type NextRequest } from "next/server";

/**
 * Baseline security headers for every page. Deliberately no Content-Security-
 * Policy here: AdSense and Next's own inline bootstrap need a policy tuned
 * against the real deployment, and a wrong CSP breaks the tools silently.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // No tool asks for a camera, microphone or location, so nothing may.
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // "allow-popups" keeps ad and share popups working while still isolating us.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  return response;
}

export const config = {
  matcher: [
    // Everything except the generated assets and files served as-is.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
};
