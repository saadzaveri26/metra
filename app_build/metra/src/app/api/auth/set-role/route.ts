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

    // 1. Strict Administrative Boundary: HQ and Officer roles can NEVER be self-assigned via public set-role
    if (
      requestedRole === "hq" ||
      requestedRole === "headquarters" ||
      requestedRole === "officer" ||
      requestedRole === "inspector"
    ) {
      return NextResponse.json(
        {
          error:
            "Role elevation forbidden: Officer and Headquarters accounts cannot be self-assigned. Officer applicants must apply via the verification queue.",
        },
        { status: 403 }
      );
    }

    // 2. Only Consumer and Vendor are permitted self-service roles
    if (requestedRole === "consumer" || requestedRole === "vendor") {
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
    }

    return NextResponse.json(
      { error: "Invalid role specified. Only 'consumer' or 'vendor' are permitted." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error setting role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update role in Clerk publicMetadata" },
      { status: 500 }
    );
  }
}
