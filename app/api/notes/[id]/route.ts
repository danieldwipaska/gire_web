import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { getWorkspaceContext, isUserInWorkspace } from "@/lib/workspace";
import Note from "@/models/Note";
import Project from "@/models/Project";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

async function canAccessNoteInWorkspace(
  note: {
    userId: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId | null;
    sharedWith?: mongoose.Types.ObjectId[];
    projectId?: mongoose.Types.ObjectId | null;
  },
  userId: string,
  activeWorkspaceId: string,
) {
  if (note.workspaceId && note.workspaceId.toString() !== activeWorkspaceId) {
    return false;
  }
  if (note.userId.toString() === userId) return true;
  if (note.sharedWith?.some((id) => id.toString() === userId)) return true;
  if (note.projectId) {
    const projectInWorkspace = await Project.exists({
      _id: note.projectId,
      workspaceId: activeWorkspaceId,
    });
    if (projectInWorkspace) return true;
  }
  return false;
}

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
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json({ error: "Workspace required" }, { status: 400 });
    }

    await connectDB();

    const note = await Note.findById(id).lean();
    if (
      !note ||
      !(await canAccessNoteInWorkspace(
        note,
        session.id,
        ctx.activeWorkspace._id,
      ))
    ) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("GET /api/notes/[id] error:", error);
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
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json({ error: "Workspace required" }, { status: 400 });
    }

    await connectDB();

    const note = await Note.findById(id);
    if (
      !note ||
      !(await canAccessNoteInWorkspace(
        note,
        session.id,
        ctx.activeWorkspace._id,
      ))
    ) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await req.json();

    if (typeof body.title === "string") {
      note.title = body.title.trim() || "Untitled Note";
    }
    if (typeof body.content === "string") {
      note.content = body.content;
    }
    if (typeof body.isPinned === "boolean") {
      note.isPinned = body.isPinned;
    }
    if (body.projectId === null || body.projectId === "") {
      note.projectId = null;
    } else if (
      typeof body.projectId === "string" &&
      mongoose.Types.ObjectId.isValid(body.projectId)
    ) {
      const validProj = await Project.exists({
        _id: body.projectId,
        workspaceId: ctx.activeWorkspace._id,
      });
      if (validProj) {
        note.projectId = new mongoose.Types.ObjectId(body.projectId);
      }
    }

    if (Array.isArray(body.tags)) {
      note.tags = Array.from(
        new Set(
          body.tags
            .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
            .filter(Boolean),
        ),
      );
    }

    if (typeof body.shareWithEmail === "string" && body.shareWithEmail.trim()) {
      const targetUser = await User.findOne({
        email: body.shareWithEmail.trim().toLowerCase(),
      }).select("_id");
      if (!targetUser) {
        return NextResponse.json(
          { error: `User not found: ${body.shareWithEmail.trim()}` },
          { status: 404 },
        );
      }

      const inSameWorkspace = await isUserInWorkspace(
        targetUser._id.toString(),
        ctx.activeWorkspace._id,
      );
      if (!inSameWorkspace) {
        return NextResponse.json(
          { error: "You can only share notes with users in the same Workspace" },
          { status: 403 },
        );
      }

      const alreadyShared = note.sharedWith.some(
        (u: mongoose.Types.ObjectId) =>
          u.toString() === targetUser._id.toString(),
      );
      if (!alreadyShared && targetUser._id.toString() !== note.userId.toString()) {
        note.sharedWith.push(targetUser._id);
      }
    }

    await note.save();
    return NextResponse.json(note);
  } catch (error) {
    console.error("PATCH /api/notes/[id] error:", error);
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
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json({ error: "Workspace required" }, { status: 400 });
    }

    await connectDB();

    const result = await Note.deleteOne({
      _id: id,
      userId: session.id,
      workspaceId: ctx.activeWorkspace._id,
    });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Note not found or forbidden" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Note deleted" });
  } catch (error) {
    console.error("DELETE /api/notes/[id] error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
