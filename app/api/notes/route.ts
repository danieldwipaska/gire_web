import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
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

    await connectDB();

    const projectId = req.nextUrl.searchParams.get("projectId");

    // Projects the user owns or belongs to
    const memberProjects = await Project.find({
      $or: [{ ownerId: session.id }, { "members.userId": session.id }],
    })
      .select("_id")
      .lean();
    const accessibleProjectIds = memberProjects.map((p) => p._id);

    const accessFilter = {
      $or: [
        { userId: session.id },
        { sharedWith: session.id },
        ...(accessibleProjectIds.length > 0
          ? [{ projectId: { $in: accessibleProjectIds } }]
          : []),
      ],
    };

    const query: Record<string, unknown> = projectId && mongoose.Types.ObjectId.isValid(projectId)
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

    const body = await req.json();
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Untitled Note";
    const content = typeof body?.content === "string" ? body.content : "";
    const tags: string[] = Array.isArray(body?.tags)
      ? Array.from(
          new Set(
            body.tags
              .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
              .filter(Boolean),
          ),
        )
      : [];

    const projectId =
      typeof body?.projectId === "string" &&
      mongoose.Types.ObjectId.isValid(body.projectId)
        ? body.projectId
        : null;

    await connectDB();

    const note = await Note.create({
      userId: session.id,
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

