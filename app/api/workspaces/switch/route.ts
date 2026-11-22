import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await req.json();
    if (typeof workspaceId !== "string" || !workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const ctx = await getWorkspaceContext(session.id);
    if (!ctx) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const target = ctx.workspaces.find((w) => w._id === workspaceId);
    if (!target) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 403 },
      );
    }

    await connectDB();
    await User.findByIdAndUpdate(session.id, {
      activeWorkspaceId: target._id,
    });

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE_NAME, target._id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({ activeWorkspace: target });
  } catch (error) {
    console.error("POST /api/workspaces/switch error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

