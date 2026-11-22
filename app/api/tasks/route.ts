import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { getWorkspaceContext, isUserInWorkspace } from "@/lib/workspace";
import Note from "@/models/Note";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
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

    const sourceNoteId = req.nextUrl.searchParams.get("sourceNoteId");
    const projectId = req.nextUrl.searchParams.get("projectId");

    const baseFilter: Record<string, unknown> = {
      workspaceId: ctx.activeWorkspace._id,
      $or: [{ assignedTo: session.id }, { createdBy: session.id }],
    };

    const andConditions: Record<string, unknown>[] = [baseFilter];
    if (sourceNoteId && mongoose.Types.ObjectId.isValid(sourceNoteId)) {
      andConditions.push({ sourceNoteId });
    }
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      andConditions.push({ projectId });
    }

    const tasks = await Task.find(
      andConditions.length === 1 ? baseFilter : { $and: andConditions },
    )
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
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

    // ONLY Super User can create & delegate tasks
    if (!ctx.isSuperUser) {
      return NextResponse.json(
        { error: "Only Super Users can create and delegate tasks" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 },
      );
    }

    await connectDB();

    let assigneeId = session.id;
    if (
      typeof body?.assignedTo === "string" &&
      mongoose.Types.ObjectId.isValid(body.assignedTo)
    ) {
      const targetUser = await User.findById(body.assignedTo).select("_id");
      if (!targetUser) {
        return NextResponse.json(
          { error: "Assigned user not found" },
          { status: 404 },
        );
      }
      assigneeId = targetUser._id.toString();
    } else if (
      typeof body?.assignedToEmail === "string" &&
      body.assignedToEmail.trim()
    ) {
      const targetUser = await User.findOne({
        email: body.assignedToEmail.trim().toLowerCase(),
      }).select("_id");
      if (!targetUser) {
        return NextResponse.json(
          {
            error: `No GiRe user found with email ${body.assignedToEmail.trim()}`,
          },
          { status: 404 },
        );
      }
      assigneeId = targetUser._id.toString();
    }

    // Enforce same-Workspace delegation strictly
    const inSameWorkspace = await isUserInWorkspace(
      assigneeId,
      ctx.activeWorkspace._id,
    );
    if (!inSameWorkspace) {
      return NextResponse.json(
        {
          error:
            "Tasks can only be delegated to users within the same Workspace",
        },
        { status: 403 },
      );
    }

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

    let sourceNoteId: string | null = null;
    if (
      typeof body?.sourceNoteId === "string" &&
      mongoose.Types.ObjectId.isValid(body.sourceNoteId)
    ) {
      const validNote = await Note.exists({
        _id: body.sourceNoteId,
        workspaceId: ctx.activeWorkspace._id,
      });
      if (validNote) sourceNoteId = body.sourceNoteId;
    }

    const priority =
      body?.priority === "low" ||
      body?.priority === "high" ||
      body?.priority === "urgent"
        ? body.priority
        : "medium";

    const dueDate =
      typeof body?.dueDate === "string" && body.dueDate
        ? new Date(body.dueDate)
        : null;

    const task = await Task.create({
      title,
      description:
        typeof body?.description === "string" ? body.description.trim() : "",
      status: "todo",
      priority,
      dueDate,
      createdBy: session.id,
      assignedTo: assigneeId,
      workspaceId: ctx.activeWorkspace._id,
      projectId,
      sourceNoteId,
    });

    if (sourceNoteId && assigneeId !== session.id) {
      await Note.updateOne(
        {
          _id: sourceNoteId,
          workspaceId: ctx.activeWorkspace._id,
          userId: { $ne: assigneeId },
        },
        { $addToSet: { sharedWith: assigneeId } },
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
