import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { getWorkspaceContext, isUserInWorkspace } from "@/lib/workspace";
import Task from "@/models/Task";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json({ error: "Workspace required" }, { status: 400 });
    }

    await connectDB();

    const task = await Task.findOne({
      _id: id,
      workspaceId: ctx.activeWorkspace._id,
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isCreator = task.createdBy.toString() === session.id;
    const isAssignee = task.assignedTo.toString() === session.id;
    if (!isCreator && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (
      body.status === "todo" ||
      body.status === "in_progress" ||
      body.status === "in_review" ||
      body.status === "done"
    ) {
      task.status = body.status;
    }

    if (isCreator && ctx.isSuperUser) {
      if (typeof body.title === "string" && body.title.trim()) {
        task.title = body.title.trim();
      }
      if (typeof body.description === "string") {
        task.description = body.description.trim();
      }
      if (
        body.priority === "low" ||
        body.priority === "medium" ||
        body.priority === "high" ||
        body.priority === "urgent"
      ) {
        task.priority = body.priority;
      }
      if (
        typeof body.assignedTo === "string" &&
        mongoose.Types.ObjectId.isValid(body.assignedTo)
      ) {
        const inWorkspace = await isUserInWorkspace(
          body.assignedTo,
          ctx.activeWorkspace._id,
        );
        if (inWorkspace) {
          const target = await User.findById(body.assignedTo).select("_id");
          if (target) task.assignedTo = target._id;
        }
      }
      if (body.dueDate === null || body.dueDate === "") {
        task.dueDate = null;
      } else if (typeof body.dueDate === "string") {
        task.dueDate = new Date(body.dueDate);
      }
    }

    await task.save();
    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
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
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace || !ctx.isSuperUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const result = await Task.deleteOne({
      _id: id,
      workspaceId: ctx.activeWorkspace._id,
      createdBy: session.id,
    });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Task not found or forbidden" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
