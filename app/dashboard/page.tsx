import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Figma,
  FileText,
  FolderKanban,
  GitPullRequest,
  Laptop,
  ListTodo,
  Pin,
  Plus,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-service";
import connectDB from "@/lib/mongodb";
import { getContextScope } from "@/lib/project-filter";
import { requirePageWorkspaceContext } from "@/lib/workspace";
import {
  IActivityEvent,
  INote,
  IProject,
  ITask,
  ProjectCategory,
} from "@/lib/types";
import { buildCategoryMaps, getTimeAgo, matchesCategoryFilter } from "@/lib/utils";
import ActivityEvent from "@/models/ActivityEvent";
import Note from "@/models/Note";
import Task from "@/models/Task";
import User from "@/models/User";
import SyncButton from "../components/buttons/SyncButton";
import SummaryCard from "../components/cards/SummaryCard";
import PriorityGitHubQueue from "../components/dashboard/PriorityGitHubQueue";
import RecentActivityCard from "../components/dashboard/RecentActivityCard";
import ContextFilterDropdown from "../components/dropdowns/ContextFilterDropdown";
import DelegatedTaskList from "../components/lists/DelegatedTaskList";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const getDueSoonCutoff = () => Date.now() + 48 * 60 * 60 * 1000;

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await requirePageWorkspaceContext(session.id);
  const workspaceId = ctx.activeWorkspace._id;

  const params = await searchParams;
  const contextParam =
    typeof params.context === "string" ? params.context : undefined;
  const projectParam =
    typeof params.project === "string" ? params.project : undefined;

  const { projects, allowedRepos } = await getContextScope(
    session.id,
    contextParam,
    projectParam,
    workspaceId,
  );

  await connectDB();

  const accessibleProjectIds = projects.map((p) => p._id);
  const repoFilter =
    allowedRepos !== null ? { repoName: { $in: allowedRepos } } : {};

  const [dashboardData, rawTasks, rawNotes, rawEvents] = await Promise.all([
    getDashboardData(session.id, allowedRepos),
    Task.find({
      workspaceId,
      assignedTo: session.id,
      status: { $ne: "done" },
      ...(projectParam ? { projectId: projectParam } : {}),
    })
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean(),
    Note.find({
      workspaceId,
      $and: [
        {
          $or: [
            { userId: session.id },
            { isEncrypted: { $ne: true }, sharedWith: session.id },
            ...(accessibleProjectIds.length > 0
              ? [
                  {
                    isEncrypted: { $ne: true },
                    projectId: { $in: accessibleProjectIds },
                  },
                ]
              : []),
          ],
        },
        ...(projectParam ? [{ projectId: projectParam }] : []),
      ],
    })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(5)
      .lean(),
    ActivityEvent.find({ userId: session.id, ...repoFilter })
      .sort({ occurredAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const {
    integrations,
    issues,
    userPullRequests,
    myPRsThisMonthCount,
    todayStats,
    reviews,
  } = dashboardData;

  const creatorIds = Array.from(
    new Set(rawTasks.map((t) => t.createdBy.toString())),
  );
  const noteIds = Array.from(
    new Set(
      rawTasks
        .map((t) => t.sourceNoteId?.toString())
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [creators, sourceNotes] = await Promise.all([
    creatorIds.length > 0
      ? User.find({ _id: { $in: creatorIds } }).select("_id name").lean()
      : Promise.resolve([]),
    noteIds.length > 0
      ? Note.find({ _id: { $in: noteIds } }).select("_id title").lean()
      : Promise.resolve([]),
  ]);

  const creatorMap = new Map(creators.map((u) => [u._id.toString(), u.name]));
  const projectMap = new Map(projects.map((p) => [p._id, p]));
  const noteTitleMap = new Map(
    sourceNotes.map((n) => [n._id.toString(), n.title]),
  );

  const delegatedTasks: ITask[] = JSON.parse(JSON.stringify(rawTasks)).map(
    (t: ITask) => ({
      ...t,
      createdByName: creatorMap.get(t.createdBy) || "Teammate",
      projectName: t.projectId ? projectMap.get(t.projectId)?.name || null : null,
      sourceNoteTitle: t.sourceNoteId
        ? noteTitleMap.get(t.sourceNoteId) || null
        : null,
    }),
  );

  const recentNotes: INote[] = JSON.parse(JSON.stringify(rawNotes)).map(
    (n: INote) => ({
      ...n,
      projectName: n.projectId ? projectMap.get(n.projectId)?.name || null : null,
    }),
  );

  const recentEvents = JSON.parse(JSON.stringify(rawEvents)) as IActivityEvent[];

  const myOpenPRs = userPullRequests.filter((pr) => pr.state === "open");

  const urgentHighTasksCount = delegatedTasks.filter(
    (t) => t.priority === "urgent" || t.priority === "high",
  ).length;
  const inProgressTasksCount = delegatedTasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const dueSoonThreshold = getDueSoonCutoff();
  const dueSoonCount = delegatedTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).getTime() <= dueSoonThreshold,
  ).length;

  const activeProjects = projects.filter((p) => p.status === "active");
  const officeProjects = activeProjects.filter((p) => p.category === "office");
  const freelanceProjects = activeProjects.filter(
    (p) => p.category === "freelance",
  );

  const { repoCategoriesMap, integrationCategoryMap } = buildCategoryMaps(
    projects,
    integrations,
  );

  const computeWorkspaceStats = (category: ProjectCategory) => {
    const projectCount = activeProjects.filter(
      (p) => p.category === category,
    ).length;
    const openPRsCount = myOpenPRs.filter((pr) =>
      matchesCategoryFilter(
        pr,
        category,
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    ).length;
    const reviewsCount = reviews.filter((pr) =>
      matchesCategoryFilter(
        pr,
        category,
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    ).length;
    const issuesCount = issues.filter((issue) =>
      matchesCategoryFilter(
        issue,
        category,
        repoCategoriesMap,
        integrationCategoryMap,
      ),
    ).length;
    const tasksCount = delegatedTasks.filter(
      (t) => t.projectId && projectMap.get(t.projectId)?.category === category,
    ).length;

    return {
      projectCount,
      openPRsCount,
      reviewsCount,
      issuesCount,
      tasksCount,
    };
  };

  const officeStats = computeWorkspaceStats("office");
  const freelanceStats = computeWorkspaceStats("freelance");

  const projectSnapshotList: (IProject & {
    openPRs: number;
    openIssues: number;
  })[] = activeProjects.slice(0, 4).map((proj) => {
    const repoSet = new Set(proj.repos || []);
    return {
      ...proj,
      openPRs: myOpenPRs.filter((pr) => repoSet.has(pr.repoName)).length,
      openIssues: issues.filter((i) => repoSet.has(i.repoName)).length,
    };
  });

  return (
    <div className="min-h-screen container space-y-6">
      {/* Header */}
      <div className="relative z-40 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center animate-fade-up">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-ink tracking-tight">
            Welcome back, {session.name || "Engineer"}
          </h2>
          <p className="text-sm text-ink-muted">
            Daily command center across your office &amp; freelance projects, GitHub queue, and notes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ContextFilterDropdown projects={projects} />
          <SyncButton />
          <Link
            href="/notes"
            className="px-4 py-2 bg-card hover:bg-highlight border border-line rounded-full text-xs font-semibold text-ink transition-all inline-flex items-center gap-1.5 shadow-[0_2px_8px_rgba(28,28,31,0.04)]"
          >
            <Plus className="w-3.5 h-3.5 text-brand-violet" />
            New Note
          </Link>
        </div>
      </div>

      {/* Row 1: Cross-Workspace KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <SummaryCard
          title="Needs Attention"
          desc={`${reviews.length} PR reviews · ${urgentHighTasksCount} urgent/high tasks`}
          value={reviews.length + urgentHighTasksCount}
          icon={
            <div className="w-10 h-10 bg-brand-orchid/15 border border-brand-orchid/25 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-brand-orchid-ink" />
            </div>
          }
        />
        <SummaryCard
          title="Active Tasks"
          desc={`${inProgressTasksCount} in progress · ${dueSoonCount} due within 48h`}
          value={delegatedTasks.length}
          icon={
            <div className="w-10 h-10 bg-brand-violet/12 border border-brand-violet/20 rounded-2xl flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-brand-violet" />
            </div>
          }
        />
        <SummaryCard
          title="Active Projects"
          desc={`${officeProjects.length} office · ${freelanceProjects.length} freelance`}
          value={activeProjects.length}
          icon={
            <div className="w-10 h-10 bg-brand-mint/25 border border-brand-mint/40 rounded-2xl flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-brand-mint-ink" />
            </div>
          }
        />
        <SummaryCard
          title="GitHub Pulse"
          desc={`${todayStats.total} PRs today · ${issues.length} open issues · ${myPRsThisMonthCount} this month`}
          value={myOpenPRs.length + issues.length}
          icon={
            <div className="w-10 h-10 bg-brand-blue/15 border border-brand-blue/25 rounded-2xl flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-brand-blue-ink" />
            </div>
          }
        />
      </div>

      {/* Row 2: Office vs Freelance Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-up-delay-1">
        <div className="bg-card border border-line rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)] hover:shadow-[0_12px_28px_rgba(28,28,31,0.07)] transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-brand-violet" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">
                  Office Workspace
                </h3>
                <p className="text-xs text-ink-muted">
                  {officeStats.projectCount} active projects
                </p>
              </div>
            </div>
            <Link
              href="/github/issues-prs?context=office"
              className="text-xs font-semibold text-brand-violet hover:text-brand-blue inline-flex items-center gap-1 transition-colors"
            >
              Open Office GitHub
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2.5 text-center">
            {[
              { label: "Open PRs", val: officeStats.openPRsCount },
              { label: "To Review", val: officeStats.reviewsCount },
              { label: "Issues", val: officeStats.issuesCount },
              { label: "Tasks", val: officeStats.tasksCount },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-highlight border border-line rounded-2xl py-2.5 px-2"
              >
                <p className="text-lg font-bold text-ink tabular-nums">{s.val}</p>
                <p className="text-[11px] text-ink-muted font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-line rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)] hover:shadow-[0_12px_28px_rgba(28,28,31,0.07)] transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-mint/25 border border-brand-mint/40 flex items-center justify-center">
                <Laptop className="w-4 h-4 text-brand-mint-ink" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">
                  Freelance Workspace
                </h3>
                <p className="text-xs text-ink-muted">
                  {freelanceStats.projectCount} active client projects
                </p>
              </div>
            </div>
            <Link
              href="/github/issues-prs?context=freelance"
              className="text-xs font-semibold text-brand-mint-ink hover:text-brand-blue inline-flex items-center gap-1 transition-colors"
            >
              Open Freelance GitHub
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2.5 text-center">
            {[
              { label: "Open PRs", val: freelanceStats.openPRsCount },
              { label: "To Review", val: freelanceStats.reviewsCount },
              { label: "Issues", val: freelanceStats.issuesCount },
              { label: "Tasks", val: freelanceStats.tasksCount },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-highlight border border-line rounded-2xl py-2.5 px-2"
              >
                <p className="text-lg font-bold text-ink tabular-nums">{s.val}</p>
                <p className="text-[11px] text-ink-muted font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Priority Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up-delay-2">
        <PriorityGitHubQueue
          reviews={reviews}
          issues={issues}
          openPullRequests={myOpenPRs}
        />
        <DelegatedTaskList tasks={delegatedTasks} />
      </div>

      {/* Row 4: Projects, Notes, & Recent GitHub Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up-delay-3">
        {/* Active Projects Snapshot */}
        <div className="bg-card border border-line rounded-3xl p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-brand-mint-ink" />
                Active Projects
              </h3>
              <Link
                href="/projects"
                className="text-xs font-semibold text-brand-violet hover:text-brand-blue inline-flex items-center gap-1"
              >
                All projects
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projectSnapshotList.length === 0 ? (
              <p className="text-xs text-ink-muted py-4">
                No active projects yet. Create one to group repos &amp; Figma designs.
              </p>
            ) : (
              <div className="space-y-2.5">
                {projectSnapshotList.map((proj) => (
                  <Link
                    key={proj._id}
                    href={`/projects/${proj._id}`}
                    className="block bg-highlight border border-line hover:border-brand-violet/45 hover:bg-white rounded-2xl p-3.5 transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink truncate">
                        {proj.name}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-card text-ink shrink-0">
                        {proj.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-ink-muted mt-1.5">
                      <span>
                        {proj.openPRs} open PRs · {proj.openIssues} issues
                      </span>
                      {proj.figmaLinks && proj.figmaLinks.length > 0 && (
                        <span className="flex items-center gap-1 text-brand-orchid-ink font-semibold">
                          <Figma className="w-3 h-3" />
                          {proj.figmaLinks.length}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Notes Snapshot */}
        <div className="bg-card border border-line rounded-3xl p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-violet" />
                Recent Notes
              </h3>
              <Link
                href="/notes"
                className="text-xs font-semibold text-brand-violet hover:text-brand-blue inline-flex items-center gap-1"
              >
                Open Notes
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <p className="text-xs text-ink-muted py-4">
                No notes yet. Create specs, snippets, or meeting notes in Notes.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentNotes.map((note) => (
                  <Link
                    key={note._id}
                    href={`/notes?noteId=${note._id}`}
                    className="block bg-highlight border border-line hover:border-brand-violet/45 hover:bg-white rounded-2xl p-3.5 transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink truncate">
                        {note.title}
                      </span>
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-brand-orchid shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-ink-muted mt-1">
                      <span className="truncate">
                        {note.projectName || "Standalone"}
                      </span>
                      {note.updatedAt && (
                        <span className="shrink-0" suppressHydrationWarning>
                          {getTimeAgo(note.updatedAt)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent GitHub Activity */}
        <RecentActivityCard events={recentEvents} />
      </div>
    </div>
  );
}
