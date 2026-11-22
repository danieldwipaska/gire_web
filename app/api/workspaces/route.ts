import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { getWorkspaceContext } from "@/lib/workspace";
import User from "@/models/User";
import Workspace from "@/models/Workspace";

export async function GET(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
  const ctx = await getWorkspaceContext(session.id, cookieWs);
  if (!ctx) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    isSuperUser: ctx.isSuperUser,
    workspaces: ctx.workspaces,
    activeWorkspace: ctx.activeWorkspace,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await getWorkspaceContext(session.id);
    if (!ctx) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!ctx.isSuperUser) {
      return NextResponse.json(
        { error: "Only Super Users can create a Workspace" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const workspace = await Workspace.create({
      name,
      description,
      ownerId: session.id,
    });

    await User.findByIdAndUpdate(session.id, {
      activeWorkspaceId: workspace._id,
    });

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE_NAME, workspace._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error("POST /api/workspaces error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

