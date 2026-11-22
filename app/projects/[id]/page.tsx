import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { requirePageWorkspaceContext } from "@/lib/workspace";
import ActivityEvent from "@/models/ActivityEvent";
import Issue from "@/models/Issue";
import Note from "@/models/Note";
import Project from "@/models/Project";
import PullRequest from "@/models/PullRequest";
import Task from "@/models/Task";
import User from "@/models/User";
import {
  IActivityEvent,
  IIssue,
  INote,
  IProject,
  IProjectMember,
  IPullRequest,
  ITask,
} from "@/lib/types";
import ProjectDetailClient from "../../components/projects/ProjectDetailClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await requirePageWorkspaceContext(session.id);

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectDB();

  const projectDoc = await Project.findOne({
    _id: id,
    workspaceId: ctx.activeWorkspace._id,
  }).lean();
  if (!projectDoc) {
    notFound();
  }

  const memberIds = Array.from(
    new Set([
      projectDoc.ownerId.toString(),
      ...(projectDoc.members || []).map(
        (m: { userId: mongoose.Types.ObjectId }) => m.userId.toString(),
      ),
    ]),
  );

  const repos: string[] = projectDoc.repos || [];

  const [
    users,
    pullRequests,
    issues,
    events,
    projectNotesRaw,
    projectTasksRaw,
    prDistinct,
    issueDistinct,
    eventDistinct,
  ] = await Promise.all([
    User.find({ _id: { $in: memberIds } })
      .select("_id name email")
      .lean(),
    repos.length > 0
      ? PullRequest.find({
          userId: session.id,
          repoName: { $in: repos },
        })
          .sort({ updatedAt: -1 })
          .limit(200)
          .lean()
      : Promise.resolve([]),
    repos.length > 0
      ? Issue.find({
          userId: session.id,
          repoName: { $in: repos },
          state: "open",
        })
          .sort({ updatedAt: -1 })
          .limit(200)
          .lean()
      : Promise.resolve([]),
    repos.length > 0
      ? ActivityEvent.find({
          userId: session.id,
          repoName: { $in: repos },
        })
          .sort({ occurredAt: -1 })
          .limit(100)
          .lean()
      : Promise.resolve([]),
    Note.find({ projectId: id })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(100)
      .lean(),
    Task.find({ projectId: id })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    PullRequest.distinct("repoName", { userId: session.id }),
    Issue.distinct("repoName", { userId: session.id }),
    ActivityEvent.distinct("repoName", { userId: session.id }),
  ]);

  const userMap = new Map(
    users.map((u) => [u._id.toString(), { name: u.name, email: u.email }]),
  );

  const populatedMembers: IProjectMember[] = (projectDoc.members || []).map(
    (m: { userId: mongoose.Types.ObjectId; role: "owner" | "member" }) => {
      const uid = m.userId.toString();
      const info = userMap.get(uid);
      return {
        userId: uid,
        role: m.role,
        name: info?.name || "Unknown",
        email: info?.email || "",
      };
    },
  );

  const availableRepos = Array.from(
    new Set(
      [...prDistinct, ...issueDistinct, ...eventDistinct, ...repos].filter(
        (r): r is string => typeof r === "string" && r.includes("/"),
      ),
    ),
  ).sort();

  const project: IProject = {
    ...(JSON.parse(JSON.stringify(projectDoc)) as IProject),
    members: populatedMembers,
  };

  const projectNotes = JSON.parse(JSON.stringify(projectNotesRaw)) as INote[];
  const projectTasks = (
    JSON.parse(JSON.stringify(projectTasksRaw)) as ITask[]
  ).map((t) => ({
    ...t,
    createdByName: userMap.get(t.createdBy)?.name || "User",
    assignedToName: userMap.get(t.assignedTo)?.name || "User",
  }));

  return (
    <ProjectDetailClient
      project={project}
      isOwner={projectDoc.ownerId.toString() === session.id}
      isSuperUser={ctx.isSuperUser}
      pullRequests={JSON.parse(JSON.stringify(pullRequests)) as IPullRequest[]}
      issues={JSON.parse(JSON.stringify(issues)) as IIssue[]}
      events={JSON.parse(JSON.stringify(events)) as IActivityEvent[]}
      projectNotes={projectNotes}
      projectTasks={projectTasks}
      availableRepos={availableRepos}
    />
  );
}
