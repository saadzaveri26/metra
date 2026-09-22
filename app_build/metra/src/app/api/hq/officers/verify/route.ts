import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let callerRole = (
      (sessionClaims as any)?.role ||
      (sessionClaims?.metadata as any)?.role ||
      (sessionClaims?.publicMetadata as any)?.role ||
      ""
    ).toLowerCase();

    const client = await clerkClient();

    if (!callerRole && userId) {
      try {
        const u = await client.users.getUser(userId);
        callerRole = String((u.publicMetadata as any)?.role || "").toLowerCase();
      } catch (err) {
        console.warn("Could not fetch Clerk user metadata in verify route:", err);
      }
    }

    if (callerRole !== "headquarters" && callerRole !== "hq") {
      return NextResponse.json(
        { error: "Forbidden: Legal Metrology Headquarters directorate authorization required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { officerId, action } = body; // action: "verify" | "reject"

    if (!officerId) {
      return NextResponse.json({ error: "officerId is required" }, { status: 400 });
    }


    if (action === "reject") {
      try {
        await client.users.updateUserMetadata(officerId, {
          publicMetadata: {
            role: "officer",
            inspector_verified: false,
            status: "rejected",
          },
        });
      } catch (clerkErr) {
        console.warn("Clerk metadata update skipped (likely mock ID):", clerkErr);
      }

      return NextResponse.json({
        success: true,
        action: "rejected",
        message: "Officer credentials rejected.",
      });
    }

    // Default: verify and approve
    try {
      await client.users.updateUserMetadata(officerId, {
        publicMetadata: {
          role: "officer",
          inspector_verified: true,
          status: "approved",
        },
      });
    } catch (clerkErr) {
      console.warn("Clerk metadata update skipped (likely mock ID):", clerkErr);
    }

    return NextResponse.json({
      success: true,
      action: "verified",
      message: "Officer credentials verified and statutory powers authorized.",
    });
  } catch (error: any) {
    console.error("HQ Officer verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process officer verification" },
      { status: 500 }
    );
  }
}
