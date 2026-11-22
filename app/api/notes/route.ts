import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { sanitizeNoteHtml } from "@/lib/security/sanitize";
import { getWorkspaceContext } from "@/lib/workspace";
import Note from "@/models/Note";
import Project from "@/models/Project";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json([]);
    }

    await connectDB();

    const projectId = req.nextUrl.searchParams.get("projectId");
    const workspaceId = ctx.activeWorkspace._id;

    const workspaceProjects = await Project.find({ workspaceId })
      .select("_id")
      .lean();
    const accessibleProjectIds = workspaceProjects.map((p) => p._id);

    const accessFilter = {
      workspaceId,
      $or: [
        { userId: session.id },
        { sharedWith: session.id },
        ...(accessibleProjectIds.length > 0
          ? [{ projectId: { $in: accessibleProjectIds } }]
          : []),
      ],
    };

    const query: Record<string, unknown> =
      projectId && mongoose.Types.ObjectId.isValid(projectId)
        ? { $and: [accessFilter, { projectId }] }
        : accessFilter;

    const notes = await Note.find(query)
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
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
        { error: "Please create a Workspace first" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 200)
        : "Untitled Note";
    const rawContent = typeof body?.content === "string" ? body.content : "";
    if (rawContent.length > 500_000) {
      return NextResponse.json(
        { error: "Note content exceeds maximum length" },
        { status: 400 },
      );
    }
    const content = sanitizeNoteHtml(rawContent);
    const tags: string[] = Array.isArray(body?.tags)
      ? Array.from(
          new Set(
            body.tags
              .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
              .filter(Boolean),
          ),
        )
      : [];

    await connectDB();

    let projectId: string | null = null;
    if (
      typeof body?.projectId === "string" &&
      mongoose.Types.ObjectId.isValid(body.projectId)
    ) {
      const validProj = await Project.exists({
        _id: body.projectId,
        workspaceId: ctx.activeWorkspace._id,
      });
      if (validProj) projectId = body.projectId;
    }

    const note = await Note.create({
      userId: session.id,
      workspaceId: ctx.activeWorkspace._id,
      projectId,
      title,
      content,
      tags,
      sharedWith: [],
      isPinned: Boolean(body?.isPinned),
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
