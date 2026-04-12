import { Activity, CircleDot, Merge, MessageSquareCode } from "lucide-react";
import SyncButton from "../components/buttons/SyncButton";
import SummaryCard from "../components/cards/SummaryCard";
import TimeDropdown from "../components/dropdowns/TimeDropdown";
import CodeChurnChartIndex from "../components/indexes/CodeChurnChartIndex";
import TaskChartIndex from "../components/indexes/TaskChartIndex";
import MergedPRChartIndex from "../components/indexes/MergedPRChartIndex";
import ActivityChartIndex from "../components/indexes/ActivityChartIndex";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { getStartDate } from "@/lib/dates";
import Integration from "@/models/Integration";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IIssue, IPullRequest, IIntegration, ICodeChurnData, ITaskChartData, IMergedPRData, IActivityData } from "@/lib/types";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const getGithubIntegration = async (userId: string) => {
  await connectDB();
  const integration: IIntegration | null = await Integration.findOne({
    userId: userId,
    provider: "github",
  }).lean();
  return integration;
};

const getAnalyticsData = async (userId: string, range: string = "this-month") => {
  await connectDB();
  const startDate = getStartDate(range);

  const [issues, pullRequests] = await Promise.all([
    Issue.find({
      updatedAt: { $gte: startDate },
      userId: userId,
    }).lean(),
    PullRequest.find({
      updatedAt: { $gte: startDate },
      userId: userId,
    }).lean(),
  ]);

  return { issues: issues as IIssue[], pullRequests: pullRequests as IPullRequest[] };
};

const calculateCodeChurn = (prs: IPullRequest[]): ICodeChurnData[] => {
  // If no PRs, return empty array
  if (!prs.length) return [];

  const churnMap = new Map();

  prs.forEach((pr) => {
    const date = pr.updatedAt
      ? new Date(pr.updatedAt).toISOString().split("T")[0]
      : null;
    if (date) {
      if (!churnMap.has(date)) {
        churnMap.set(date, {
          day: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          additions: 0,
          deletions: 0,
          changedFiles: 0,
          rawDate: date,
        });
      }
      const entry = churnMap.get(date);
      entry.additions += pr.additions || 0;
      entry.deletions += pr.deletions || 0;
      entry.changedFiles += pr.changedFiles || 0;
    }
  });

  // Sort by date
  return Array.from(churnMap.values()).sort((a: any, b: any) =>
    a.rawDate.localeCompare(b.rawDate),
  );
};

const calculatePrMergedAndPrReviewsRequested = (prs: IPullRequest[], githubUsername: string): ITaskChartData[] => {
  let merged = 0;
  let reviewsRequested = 0;
  for (const pr of prs) {
    if (pr.author === githubUsername && pr.mergedAt) {
      merged++;
      continue;
    }
    if (pr.reviewRequested || pr.mentionedInDescription) reviewsRequested++;
  }
  return [
    { name: "Merged", value: merged, fraction: merged / (merged + reviewsRequested), color: "#3b82f6" },
    { name: "Reviews Requested", value: reviewsRequested, fraction: reviewsRequested / (merged + reviewsRequested), color: "#22c55e" },
  ];
};

const calculateMergedTimeline = (prs: IPullRequest[]): IMergedPRData[] => {
  const timelineMap = new Map();

  prs.forEach((pr) => {
    if (pr.state === "closed" && pr.mergedAt) {
      const d = new Date(pr.mergedAt);
      // Get week start (Monday)
      const day = d.getDay() || 7;
      if (day !== 1) d.setHours(-24 * (day - 1));
      d.setHours(0, 0, 0, 0);
      const weekLabel = `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      if (!timelineMap.has(weekLabel)) {
        timelineMap.set(weekLabel, {
          week: weekLabel,
          merged: 0,
          rawDate: d.getTime(),
        });
      }
      timelineMap.get(weekLabel).merged++;
    }
  });

  return Array.from(timelineMap.values()).sort(
    (a: any, b: any) => a.rawDate - b.rawDate,
  );
};

const calculateRepoActivity = (prs: IPullRequest[], issues: IIssue[], githubUsername: string): IActivityData[] => {
  const repoMap = new Map();

  const initRepo = (repo: string) => {
    if (!repoMap.has(repo)) {
      repoMap.set(repo, { repo, prs: 0, issues: 0, merged: 0 });
    }
  };

  prs.forEach((pr) => {
    if (pr.repoName && pr.author === githubUsername) {
      initRepo(pr.repoName);
      const entry = repoMap.get(pr.repoName);
      entry.prs++;
      if (pr.state === "closed") entry.merged++;
    }
  });

  issues.forEach((issue) => {
    if (issue.repoName && issue.assignee === githubUsername) {
      initRepo(issue.repoName);
      repoMap.get(issue.repoName).issues++;
    }
  });

  return Array.from(repoMap.values())
    .sort((a: any, b: any) => b.prs - a.prs)
    .slice(0, 5);
};

const Analytics = async ({ searchParams }: Props) => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const range = (params.range as string) || "this-month";
  const { issues, pullRequests } = await getAnalyticsData(session.id as string, range);
  const githubIntegration = await getGithubIntegration(session.id as string);

  if (!githubIntegration) {
    return (
      <div className="min-h-screen container">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400">No GitHub integration found</p>
        </div>
      </div>
    );
  }

  // Summary Metrics
  const totalPRsMerged = pullRequests.filter(
    (pr) =>
      pr.author === githubIntegration.githubUsername &&
      pr.state === "closed" &&
      !pr.mentionedInDescription &&
      !pr.reviewRequested &&
      pr.mergedAt,
  ).length;

  const totalLinesChanged = pullRequests
    .filter((pr) => pr.author === githubIntegration.githubUsername && !pr.mentionedInDescription && !pr.reviewRequested)
    .reduce(
      (acc, pr) => {
        acc.added += pr.additions || 0;
        acc.removed += pr.deletions || 0;
        return acc;
      },
      { added: 0, removed: 0 },
    );

  const reviewRequestedCount = pullRequests.filter(
    (pr) => pr.reviewRequested || pr.mentionedInDescription,
  ).length;

  const closedIssuesCount = issues.filter(
    (i) => i.state === "closed",
  ).length;

  // Chart Data
  const codeChurnData = calculateCodeChurn(pullRequests.filter((pr) => !pr.mentionedInDescription && !pr.reviewRequested));
  const prMergedAndPrReviewsRequested =
    calculatePrMergedAndPrReviewsRequested(pullRequests, githubIntegration.githubUsername);
  const mergedTimeline = calculateMergedTimeline(pullRequests);
  const repoActivity = calculateRepoActivity(pullRequests, issues, githubIntegration.githubUsername);

  return (
    <div className="min-h-screen container">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between">
        <div className="flex flex-col gap-2">
          <h2>Analytics</h2>
          <p className="text-lg text-white/70">
            Here&apos;s an overview of your Github activity
          </p>
        </div>
        <div className="flex gap-3 h-fit relative">
          <SyncButton />
          <TimeDropdown />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        <SummaryCard
          title="PRs Merged"
          desc="Total PRs merged"
          value={totalPRsMerged}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Merge className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
        />
        <SummaryCard
          title="Lines Changed"
          desc="Total lines added and removed"
          value={totalLinesChanged.added + totalLinesChanged.removed}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
          footer={
            <>
              <span className="text-sm font-semibold text-green-400">
                +{totalLinesChanged.added}
              </span>
              <span className="text-white/60 text-sm">/</span>
              <span className="text-sm font-semibold text-red-400">
                -{totalLinesChanged.removed}
              </span>
            </>
          }
        />
        <SummaryCard
          title="Review Requested"
          desc="Total PRs that need your review"
          value={reviewRequestedCount}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquareCode className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
        />
        <SummaryCard
          title="Closed Issues"
          desc="Closed issues assigned to you"
          value={closedIssuesCount}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <CircleDot className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
        />
      </div>
      <div className="mb-6">
        <CodeChurnChartIndex data={codeChurnData} />
      </div>
      <div className="mb-6">
        <TaskChartIndex data={prMergedAndPrReviewsRequested} />
      </div>
      <div className="mb-6">
        <MergedPRChartIndex data={mergedTimeline} />
      </div>
      <div className="mb-6">
        <ActivityChartIndex data={repoActivity} />
      </div>
    </div>
  );
};

export default Analytics;
