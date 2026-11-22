import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { isValidFigmaUrl } from "@/lib/utils";
import { getWorkspaceContext, isUserInWorkspace } from "@/lib/workspace";
import Project from "@/models/Project";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json({ error: "Workspace required" }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      workspaceId: ctx.activeWorkspace._id,
    }).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json({ error: "Workspace required" }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      workspaceId: ctx.activeWorkspace._id,
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();

    if (typeof body.name === "string" && body.name.trim()) {
      project.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      project.description = body.description.trim();
    }
    if (
      body.category === "office" ||
      body.category === "freelance" ||
      body.category === "personal"
    ) {
      project.category = body.category;
    }
    if (typeof body.clientOrTeam === "string") {
      project.clientOrTeam = body.clientOrTeam.trim();
    }
    if (
      body.status === "active" ||
      body.status === "on_hold" ||
      body.status === "completed" ||
      body.status === "archived"
    ) {
      project.status = body.status;
    }
    if (typeof body.color === "string") {
      project.color = body.color;
    }
    if (Array.isArray(body.repos)) {
      project.repos = Array.from(
        new Set(
          body.repos
            .map((r: unknown) => (typeof r === "string" ? r.trim() : ""))
            .filter(Boolean),
        ),
      );
    }

    if (Array.isArray(body.figmaLinks)) {
      const nextLinks = [];
      for (const link of body.figmaLinks) {
        const url = typeof link?.url === "string" ? link.url.trim() : "";
        if (!url) continue;
        if (!isValidFigmaUrl(url)) {
          return NextResponse.json(
            { error: `Invalid Figma URL: ${url}` },
            { status: 400 },
          );
        }
        nextLinks.push({
          title:
            typeof link?.title === "string" && link.title.trim()
              ? link.title.trim()
              : "Figma Design",
          url,
          kind: link?.kind === "prototype" ? "prototype" : "design",
        });
      }
      project.figmaLinks = nextLinks;
    }

    // Add member by email — strictly within the SAME Workspace!
    if (typeof body.addMemberEmail === "string" && body.addMemberEmail.trim()) {
      if (!ctx.isSuperUser) {
        return NextResponse.json(
          { error: "Only Super Users can manage project members" },
          { status: 403 },
        );
      }

      const targetUser = await User.findOne({
        email: body.addMemberEmail.trim().toLowerCase(),
      }).select("_id name email");

      if (!targetUser) {
        return NextResponse.json(
          { error: `No GiRe user found with email ${body.addMemberEmail.trim()}` },
          { status: 404 },
        );
      }

      const inSameWorkspace = await isUserInWorkspace(
        targetUser._id.toString(),
        ctx.activeWorkspace._id,
      );
      if (!inSameWorkspace) {
        return NextResponse.json(
          { error: "User does not belong to this Workspace" },
          { status: 403 },
        );
      }

      const alreadyMember = project.members.some(
        (m: { userId: mongoose.Types.ObjectId }) =>
          m.userId.toString() === targetUser._id.toString(),
      );
      if (alreadyMember) {
        return NextResponse.json(
          { error: "User is already a member of this project" },
          { status: 400 },
        );
      }

      project.members.push({ userId: targetUser._id, role: "member" });
    }

    if (typeof body.removeMemberId === "string" && body.removeMemberId) {
      if (!ctx.isSuperUser) {
        return NextResponse.json(
          { error: "Only Super Users can manage project members" },
          { status: 403 },
        );
      }
      if (body.removeMemberId === project.ownerId.toString()) {
        return NextResponse.json(
          { error: "Cannot remove project owner" },
          { status: 400 },
        );
      }
      project.members = project.members.filter(
        (m: { userId: mongoose.Types.ObjectId }) =>
          m.userId.toString() !== body.removeMemberId,
      );
    }

    await project.save();
    return NextResponse.json(project);
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json({ error: "Workspace required" }, { status: 400 });
    }

    await connectDB();

    const result = await Project.deleteOne({
      _id: id,
      workspaceId: ctx.activeWorkspace._id,
      ownerId: session.id,
    });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Project not found or forbidden" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
