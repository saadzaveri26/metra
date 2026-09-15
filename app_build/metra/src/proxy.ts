import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isOfficerRoute = createRouteMatcher(["/officer(.*)", "/inspector(.*)"]);
const isVendorRoute = createRouteMatcher(["/vendor(.*)"]);
const isConsumerRoute = createRouteMatcher(["/consumer(.*)"]);
const isHqRoute = createRouteMatcher(["/headquarters(.*)", "/hq(.*)"]);

const proxyHandler = clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Redirect unauthenticated requests to our app's own local /sign-in page
  const toLocalSignIn = (returnUrl?: string) => {
    const signInUrl = new URL("/sign-in", req.url);
    if (returnUrl) {
      signInUrl.searchParams.set("redirect_url", returnUrl);
    }
    return NextResponse.redirect(signInUrl);
  };

  // Extract role claim from either custom JWT claim or session publicMetadata
  let role =
    (sessionClaims as any)?.role ||
    (sessionClaims?.metadata as any)?.role ||
    (sessionClaims?.publicMetadata as any)?.role;

  // Fallback: If role claim is not yet in the session token (e.g. before token refresh or template config),
  // fetch directly from Clerk user publicMetadata so legitimate users are never locked out.
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = (user.publicMetadata as any)?.role;
    } catch (e) {
      console.error("Proxy fallback user fetch error:", e);
    }
  }

  // Default authenticated users without an explicit administrative role to "consumer"
  if (!role && userId) {
    role = "consumer";
  }

  // 1. Officer route protection
  if (isOfficerRoute(req)) {
    if (!userId) return toLocalSignIn(req.url);
    if (role !== "officer" && role !== "inspector") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // 2. Vendor route protection
  if (isVendorRoute(req)) {
    if (!userId) return toLocalSignIn(req.url);
    if (role !== "vendor") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // 3. Consumer route protection
  if (isConsumerRoute(req)) {
    if (!userId) return toLocalSignIn(req.url);
    if (role !== "consumer") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // 4. Legal Metrology HQ route protection
  if (isHqRoute(req)) {
    if (!userId) return toLocalSignIn(req.url);
    if (role !== "headquarters" && role !== "hq") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }
});

export default proxyHandler;
export const proxy = proxyHandler;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
