import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import {
  getProjectReviewStatus,
  isAnyUser,
  isIssueAssignedTo,
  isProjectReviewPR,
} from "@/lib/utils";
import { getWorkspaceUsers, requirePageWorkspaceContext } from "@/lib/workspace";
import ActivityEvent from "@/models/ActivityEvent";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import Note from "@/models/Note";
import Project from "@/models/Project";
import PullRequest from "@/models/PullRequest";
import Task from "@/models/Task";
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

  const repos: string[] = projectDoc.repos || [];

  const [
    workspaceUsers,
    githubIntegrations,
    rawPullRequests,
    rawIssues,
    events,
    projectNotesRaw,
    projectTasksRaw,
    prDistinct,
    issueDistinct,
    eventDistinct,
  ] = await Promise.all([
    getWorkspaceUsers(ctx.activeWorkspace._id),
    Integration.find({ userId: session.id, provider: "github" })
      .select("githubUsername")
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
    Note.find({
      projectId: id,
      workspaceId: ctx.activeWorkspace._id,
      $or: [{ userId: session.id }, { isEncrypted: { $ne: true } }],
    })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(100)
      .lean(),
    Task.find({ projectId: id, workspaceId: ctx.activeWorkspace._id })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    PullRequest.distinct("repoName", { userId: session.id }),
    Issue.distinct("repoName", { userId: session.id }),
    ActivityEvent.distinct("repoName", { userId: session.id }),
  ]);

  const githubUsernames = githubIntegrations
    .map((i) => i.githubUsername)
    .filter((u): u is string => Boolean(u));

  const pullRequests =
    githubUsernames.length > 0
      ? rawPullRequests.filter((pr) => isAnyUser(pr.author, githubUsernames))
      : [];

  const reviewedUrls = new Set(
    events
      .filter((e) => e.type === "pr_reviewed" && typeof e.url === "string")
      .map((e) => e.url as string),
  );

  const serializedRawPrs = JSON.parse(
    JSON.stringify(rawPullRequests),
  ) as IPullRequest[];

  const reviewPullRequests =
    githubUsernames.length > 0
      ? serializedRawPrs
          .filter((pr) => isProjectReviewPR(pr, githubUsernames, reviewedUrls))
          .map((pr) => {
            const reviewStatus = getProjectReviewStatus(pr, reviewedUrls);
            return {
              ...pr,
              ...(reviewStatus === "reviewed" && !pr.reviewedByMe
                ? { reviewedByMe: true }
                : {}),
            };
          })
      : [];

  const issues =
    githubUsernames.length > 0
      ? rawIssues.filter((issue) => isIssueAssignedTo(issue, githubUsernames))
      : rawIssues;

  const userMap = new Map(
    workspaceUsers.map((u) => [u._id, { name: u.name, email: u.email }]),
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
      reviewPullRequests={reviewPullRequests}
      issues={JSON.parse(JSON.stringify(issues)) as IIssue[]}
      events={JSON.parse(JSON.stringify(events)) as IActivityEvent[]}
      projectNotes={projectNotes}
      projectTasks={projectTasks}
      availableRepos={availableRepos}
    />
  );
}
