import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { getWorkspaceContext, getWorkspaceUsers } from "@/lib/workspace";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
  const ctx = await getWorkspaceContext(session.id, cookieWs);
  if (!ctx || !ctx.activeWorkspace) {
    return NextResponse.json(
      { error: "Active workspace not found" },
      { status: 404 },
    );
  }

  const members = await getWorkspaceUsers(ctx.activeWorkspace._id);
  return NextResponse.json({
    workspace: ctx.activeWorkspace,
    isSuperUser: ctx.isSuperUser,
    members,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json(
        { error: "Active workspace not found" },
        { status: 400 },
      );
    }

    if (!ctx.isSuperUser) {
      return NextResponse.json(
        { error: "Only Super Users can create members in a Workspace" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const targetWorkspaceId =
      typeof body?.workspaceId === "string" && body.workspaceId
        ? body.workspaceId
        : ctx.activeWorkspace._id;

    // Super User can only create members in a Workspace they own
    const ownedWorkspace = ctx.workspaces.find(
      (w) => w._id === targetWorkspaceId,
    );
    if (!ownedWorkspace) {
      return NextResponse.json(
        { error: "You can only create members inside your own Workspace" },
        { status: 403 },
      );
    }

    if (!name || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Name, valid email, and password (min 6 chars) are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return NextResponse.json(
        {
          error:
            "A user with this email already exists. Regular users can only belong to one Workspace.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const member = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "member",
      workspaceId: ownedWorkspace._id,
      createdBy: session.id,
    });

    return NextResponse.json(
      {
        _id: member._id.toString(),
        name: member.name,
        email: member.email,
        role: member.role,
        workspaceId: ownedWorkspace._id,
        createdAt: member.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/workspaces/members error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json(
        { error: "Active workspace not found" },
        { status: 400 },
      );
    }

    if (!ctx.isSuperUser) {
      return NextResponse.json(
        { error: "Only Super Users can remove members" },
        { status: 403 },
      );
    }

    const { memberId } = await req.json();
    if (
      typeof memberId !== "string" ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      return NextResponse.json({ error: "Invalid memberId" }, { status: 400 });
    }

    if (memberId === session.id) {
      return NextResponse.json(
        { error: "Super User cannot delete their own owner account here" },
        { status: 400 },
      );
    }

    await connectDB();

    const ownedIds = ctx.workspaces.map((w) => w._id);
    const result = await User.deleteOne({
      _id: memberId,
      role: "member",
      workspaceId: { $in: ownedIds },
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Member not found in your Workspaces" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Member removed" });
  } catch (error) {
    console.error("DELETE /api/workspaces/members error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

