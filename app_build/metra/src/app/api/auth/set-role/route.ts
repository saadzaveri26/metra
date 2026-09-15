import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const requestedRole = (body.role || "").toLowerCase().trim();

    // Strict role boundary enforcement: public self-service allows ONLY consumer and vendor!
    if (
      requestedRole === "officer" ||
      requestedRole === "inspector" ||
      requestedRole === "hq" ||
      requestedRole === "headquarters"
    ) {
      return NextResponse.json(
        {
          error:
            "Role elevation forbidden: Officer and Headquarters accounts require administrative provisioning and cannot be self-assigned.",
        },
        { status: 403 }
      );
    }

    if (requestedRole !== "consumer" && requestedRole !== "vendor") {
      return NextResponse.json(
        { error: "Invalid role specified. Must be 'consumer' or 'vendor'." },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: requestedRole,
      },
    });

    return NextResponse.json({
      success: true,
      userId,
      role: requestedRole,
    });
  } catch (error: any) {
    console.error("Error setting role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update role in Clerk publicMetadata" },
      { status: 500 }
    );
  }
}
