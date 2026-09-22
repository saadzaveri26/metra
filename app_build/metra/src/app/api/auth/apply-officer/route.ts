import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { API_BASE } from "@/lib/api";


export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User session required to apply for officer credentials" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const governmentId = (body.government_id || "").trim();
    const stateRegion = (body.state_region || "").trim();
    const designation = (body.designation || "Legal Metrology Inspector").trim();
    const phone = (body.phone || "").trim() || null;
    const fullName =
      (body.full_name || "").trim() ||
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      "Legal Metrology Officer";
    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress || (body.email || "").trim() || "officer@doca.gov.in";

    if (!governmentId) {
      return NextResponse.json(
        { error: "Official Government Officer / Inspector ID is required." },
        { status: 400 }
      );
    }

    if (!stateRegion) {
      return NextResponse.json(
        { error: "Jurisdiction State / Directorate region is required." },
        { status: 400 }
      );
    }

    // Assign non-functional pending role in Clerk metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "officer_pending",
        inspector_verified: false,
        status: "pending_approval",
        government_id: governmentId,
        state_region: stateRegion,
        designation: designation,
        applied_at: new Date().toISOString(),
      },
    });

    // Enqueue applicant into Backend HQ Officer verification roster
    try {
      await fetch(`${API_BASE}/auth/register/officer-application`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          full_name: fullName,
          government_id: governmentId,
          state_region: stateRegion,
          designation: designation,
          phone: phone,
        }),
      });
    } catch (backendErr) {
      console.warn("Backend roster sync notice (will resolve upon HQ refresh):", backendErr);
    }

    return NextResponse.json({
      success: true,
      userId,
      role: "officer_pending",
      inspector_verified: false,
      status: "pending_approval",
      redirect_url: "/officer/pending",
    });
  } catch (error: any) {
    console.error("Officer application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit officer application" },
      { status: 500 }
    );
  }
}
