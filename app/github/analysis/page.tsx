import { Activity, CircleDot, Merge, MessageSquareCode } from "lucide-react";
import SyncButton from "../../components/buttons/SyncButton";
import SummaryCard from "../../components/cards/SummaryCard";
import TimeDropdown from "../../components/dropdowns/TimeDropdown";
import ContextFilterDropdown from "../../components/dropdowns/ContextFilterDropdown";
import CodeChurnChartIndex from "../../components/indexes/CodeChurnChartIndex";
import TaskChartIndex from "../../components/indexes/TaskChartIndex";
import MergedPRChartIndex from "../../components/indexes/MergedPRChartIndex";
import ActivityChartIndex from "../../components/indexes/ActivityChartIndex";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { formatShortMonthDay, getStartDate, toLocalDateKey } from "@/lib/dates";
import Integration from "@/models/Integration";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  IIssue,
  IPullRequest,
  IIntegration,
  ICodeChurnData,
  ITaskChartData,
  IMergedPRData,
  IActivityData,
} from "@/lib/types";
import { isAnyUser, isIssueAssignedTo, isPRNeedingReview } from "@/lib/utils";
import { getContextScope } from "@/lib/project-filter";
import { requirePageWorkspaceContext } from "@/lib/workspace";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const getGithubIntegrations = async (userId: string) => {
  await connectDB();
  const integrations: IIntegration[] = await Integration.find({
    userId,
    provider: "github",
  })
    .select("-accessToken")
    .lean();
  return integrations;
};

const getAnalyticsData = async (
  userId: string,
  range: string = "this-month",
  allowedRepos: string[] | null = null,
) => {
  await connectDB();
  const startDate = getStartDate(range);
  const repoFilter =
    allowedRepos !== null ? { repoName: { $in: allowedRepos } } : {};

  const [issues, pullRequests] = await Promise.all([
    Issue.find({
      userId,
      ...repoFilter,
      $or: [
        { closedAt: { $gte: startDate } },
        { githubCreatedAt: { $gte: startDate } },
        { updatedAt: { $gte: startDate } },
      ],
    }).lean(),
    PullRequest.find({
      userId,
      ...repoFilter,
      $or: [
        { mergedAt: { $gte: startDate } },
        { githubCreatedAt: { $gte: startDate } },
        { updatedAt: { $gte: startDate } },
        { state: "open" },
      ],
    }).lean(),
  ]);

  return {
    startDate,
    issues: issues as IIssue[],
    pullRequests: pullRequests as IPullRequest[],
  };
};

const calculateCodeChurn = (mergedPrs: IPullRequest[]): ICodeChurnData[] => {
  if (!mergedPrs.length) return [];

  const churnMap = new Map<string, ICodeChurnData>();

  mergedPrs.forEach((pr) => {
    if (!pr.mergedAt) return;
    const dateKey = toLocalDateKey(pr.mergedAt);
    if (!churnMap.has(dateKey)) {
      churnMap.set(dateKey, {
        day: formatShortMonthDay(pr.mergedAt),
        additions: 0,
        deletions: 0,
        changedFiles: 0,
        rawDate: dateKey,
      });
    }
    const entry = churnMap.get(dateKey)!;
    entry.additions += pr.additions || 0;
    entry.deletions += pr.deletions || 0;
    entry.changedFiles += pr.changedFiles || 0;
  });

  return Array.from(churnMap.values()).sort((a, b) =>
    a.rawDate.localeCompare(b.rawDate),
  );
};

const calculatePrMergedAndPrReviewsRequested = (
  mergedCount: number,
  reviewsRequestedCount: number,
): ITaskChartData[] => {
  const total = mergedCount + reviewsRequestedCount || 1;
  return [
    {
      name: "My Merged PRs",
      value: mergedCount,
      fraction: mergedCount / total,
      color: "var(--ui-mint)",
    },
    {
      name: "PR Reviews Needed",
      value: reviewsRequestedCount,
      fraction: reviewsRequestedCount / total,
      color: "var(--ui-violet)",
    },
  ];
};

const calculateMergedTimeline = (mergedPrs: IPullRequest[]): IMergedPRData[] => {
  const timelineMap = new Map<string, IMergedPRData>();

  mergedPrs.forEach((pr) => {
    if (!pr.mergedAt) return;
    const d = new Date(pr.mergedAt);
    const day = d.getDay() || 7;
    if (day !== 1) d.setDate(d.getDate() - (day - 1));
    d.setHours(0, 0, 0, 0);

    const weekKey = toLocalDateKey(d);
    const weekLabel = `Week of ${formatShortMonthDay(d)}`;

    if (!timelineMap.has(weekKey)) {
      timelineMap.set(weekKey, {
        week: weekLabel,
        merged: 0,
        rawDate: d.getTime(),
      });
    }
    timelineMap.get(weekKey)!.merged++;
  });

  return Array.from(timelineMap.values()).sort((a, b) => a.rawDate - b.rawDate);
};

const calculateRepoActivity = (
  myPrsInRange: IPullRequest[],
  issuesInRange: IIssue[],
  githubUsernames: string[],
): IActivityData[] => {
  const repoMap = new Map<string, IActivityData>();

  const initRepo = (repo: string) => {
    if (!repoMap.has(repo)) {
      repoMap.set(repo, { repo, prs: 0, issues: 0, merged: 0 });
    }
  };

  myPrsInRange.forEach((pr) => {
    if (pr.repoName) {
      initRepo(pr.repoName);
      const entry = repoMap.get(pr.repoName)!;
      entry.prs++;
      if (pr.state === "closed" && pr.mergedAt) {
        entry.merged++;
      }
    }
  });

  issuesInRange.forEach((issue) => {
    if (issue.repoName && isIssueAssignedTo(issue, githubUsernames)) {
      initRepo(issue.repoName);
      repoMap.get(issue.repoName)!.issues++;
    }
  });

  return Array.from(repoMap.values())
    .sort((a, b) => b.prs + b.merged - (a.prs + a.merged))
    .slice(0, 5);
};

export default async function GitHubAnalysisPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await requirePageWorkspaceContext(session.id);

  const params = await searchParams;
  const range = (params.range as string) || "this-month";
  const contextParam =
    typeof params.context === "string" ? params.context : undefined;
  const projectParam =
    typeof params.project === "string" ? params.project : undefined;

  const [{ projects, allowedRepos }, githubIntegrations] = await Promise.all([
    getContextScope(
      session.id as string,
      contextParam,
      projectParam,
      ctx.activeWorkspace._id,
    ),
    getGithubIntegrations(session.id as string),
  ]);

  if (githubIntegrations.length === 0) {
    return (
      <div className="min-h-screen container">
        <div className="bg-card border border-line rounded-3xl p-8 flex flex-col gap-2 shadow-[0_2px_12px_rgba(28,28,31,0.04)] animate-fade-up">
          <h1 className="text-2xl font-bold text-ink">Analysis</h1>
          <p className="text-sm text-ink-muted">No GitHub integration found</p>
        </div>
      </div>
    );
  }

  const { startDate, issues, pullRequests } = await getAnalyticsData(
    session.id as string,
    range,
    allowedRepos,
  );

  const usernames = githubIntegrations
    .map((i) => i.githubUsername)
    .filter(Boolean);

  const myPullRequests = pullRequests.filter((pr) =>
    isAnyUser(pr.author, usernames),
  );
  const myMergedPRsInRange = myPullRequests.filter(
    (pr) =>
      pr.state === "closed" &&
      pr.mergedAt &&
      new Date(pr.mergedAt) >= startDate,
  );
  const myActiveRepoPRsInRange = myPullRequests.filter((pr) => {
    const createdInRange =
      new Date(pr.githubCreatedAt || pr.updatedAt) >= startDate;
    const mergedInRange = Boolean(
      pr.state === "closed" && pr.mergedAt && new Date(pr.mergedAt) >= startDate,
    );
    return createdInRange || mergedInRange;
  });

  const reviewPullRequests = pullRequests.filter((pr) =>
    isPRNeedingReview(pr, usernames),
  );

  const myIssuesInRange = issues.filter(
    (i) =>
      isIssueAssignedTo(i, usernames) &&
      new Date(i.githubCreatedAt || i.updatedAt) >= startDate,
  );

  const totalPRsMerged = myMergedPRsInRange.length;

  const totalLinesChanged = myMergedPRsInRange.reduce(
    (acc, pr) => {
      acc.added += pr.additions || 0;
      acc.removed += pr.deletions || 0;
      return acc;
    },
    { added: 0, removed: 0 },
  );

  const reviewRequestedCount = reviewPullRequests.length;

  const closedIssuesCount = issues.filter(
    (i) =>
      i.state === "closed" &&
      isIssueAssignedTo(i, usernames) &&
      new Date(i.closedAt || i.updatedAt) >= startDate,
  ).length;

  const codeChurnData = calculateCodeChurn(myMergedPRsInRange);
  const prMergedAndPrReviewsRequested =
    calculatePrMergedAndPrReviewsRequested(totalPRsMerged, reviewRequestedCount);
  const mergedTimeline = calculateMergedTimeline(myMergedPRsInRange);
  const repoActivity = calculateRepoActivity(
    myActiveRepoPRsInRange,
    myIssuesInRange,
    usernames,
  );

  return (
    <div className="min-h-screen container">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between animate-fade-up">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-ink tracking-tight">GitHub Analysis</h2>
          <p className="text-sm text-ink-muted">
            Overview of your GitHub pull requests, code churn, and repository metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 h-fit relative">
          <ContextFilterDropdown projects={projects} />
          <SyncButton />
          <TimeDropdown />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 my-6">
        <SummaryCard
          title="PRs Merged"
          desc="Total PRs merged in period"
          value={totalPRsMerged}
          icon={
            <div className="w-10 h-10 bg-brand-mint/25 border border-brand-mint/40 rounded-2xl flex items-center justify-center">
              <Merge className="w-5 h-5 text-brand-mint-ink" />
            </div>
          }
        />
        <SummaryCard
          title="Lines Changed"
          desc="Lines added & removed in merged PRs"
          value={totalLinesChanged.added + totalLinesChanged.removed}
          icon={
            <div className="w-10 h-10 bg-brand-violet/12 border border-brand-violet/20 rounded-2xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-violet" />
            </div>
          }
          footer={
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-brand-mint-ink">+{totalLinesChanged.added}</span>
              <span className="text-line-dashed">/</span>
              <span className="text-rose-600">-{totalLinesChanged.removed}</span>
            </div>
          }
        />
        <SummaryCard
          title="Review Requested"
          desc="Open PRs awaiting your review"
          value={reviewRequestedCount}
          icon={
            <div className="w-10 h-10 bg-brand-orchid/15 border border-brand-orchid/25 rounded-2xl flex items-center justify-center">
              <MessageSquareCode className="w-5 h-5 text-brand-orchid-ink" />
            </div>
          }
        />
        <SummaryCard
          title="Closed Issues"
          desc="Closed issues assigned to you"
          value={closedIssuesCount}
          icon={
            <div className="w-10 h-10 bg-brand-blue/15 border border-brand-blue/25 rounded-2xl flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-brand-blue-ink" />
            </div>
          }
        />
      </div>

      <div className="mb-6 animate-fade-up-delay-1">
        <CodeChurnChartIndex data={codeChurnData} />
      </div>
      <div className="mb-6 animate-fade-up-delay-2">
        <TaskChartIndex data={prMergedAndPrReviewsRequested} />
      </div>
      <div className="mb-6 animate-fade-up-delay-2">
        <MergedPRChartIndex data={mergedTimeline} />
      </div>
      <div className="mb-6 animate-fade-up-delay-3">
        <ActivityChartIndex data={repoActivity} />
      </div>
    </div>
  );
}
