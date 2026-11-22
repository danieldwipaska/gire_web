import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import Integration from "@/models/Integration";
import { getStartDate, getStartOfToday, toLocalDateKey } from "@/lib/dates";
import { IDashboardData, IIntegration, IIssue, IPullRequest } from "@/lib/types";
import { isAnyUser, isIssueAssignedTo, isPRNeedingReview } from "@/lib/utils";

export const getDashboardData = async (
  userId: string,
  allowedRepos: string[] | null = null,
): Promise<IDashboardData> => {
  await connectDB();

  // 1. Fetch Integrations (all GitHub accounts)
  const integrations: IIntegration[] = await Integration.find({
    userId,
    provider: "github",
  })
    .select("-accessToken")
    .lean();
  const githubUsernames = integrations
    .filter((i) => i.provider === "github")
    .map((i) => i.githubUsername)
    .filter(Boolean);

  const repoFilter =
    allowedRepos !== null ? { repoName: { $in: allowedRepos } } : {};

  // 2. Fetch Open Issues
  const rawOpenIssues: IIssue[] = await Issue.find({
    userId,
    state: "open",
    ...repoFilter,
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  const issues =
    githubUsernames.length > 0
      ? rawOpenIssues.filter((issue) =>
          isIssueAssignedTo(issue, githubUsernames),
        )
      : rawOpenIssues;

  // 3. Fetch Pull Requests (last 30 days OR still open for reviews)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const pullRequests: IPullRequest[] = await PullRequest.find({
    userId,
    ...repoFilter,
    $or: [
      { updatedAt: { $gte: thirtyDaysAgo } },
      { githubCreatedAt: { $gte: thirtyDaysAgo } },
      { state: "open" },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  // 4. User Specific PRs (Authored by any connected GitHub account)
  const userPullRequests = pullRequests.filter((pr) =>
    isAnyUser(pr.author, githubUsernames),
  );

  // 5. My PRs Created This Month
  const startOfMonth = getStartDate("this-month");
  let myPRsThisMonthCount = 0;
  if (githubUsernames.length > 0) {
    const myPRsThisYear: IPullRequest[] = await PullRequest.find({
      userId,
      ...repoFilter,
      $or: [
        { githubCreatedAt: { $gte: startOfMonth } },
        { githubCreatedAt: { $exists: false }, updatedAt: { $gte: startOfMonth } },
      ],
    })
      .select("author githubCreatedAt updatedAt")
      .lean();

    myPRsThisMonthCount = myPRsThisYear.filter((pr) =>
      isAnyUser(pr.author, githubUsernames),
    ).length;
  }

  // 6. Today's PRs authored by user (created today)
  const startOfToday = getStartOfToday();
  const todayPullRequests = userPullRequests.filter((pr) => {
    const createdDate = new Date(pr.githubCreatedAt || pr.updatedAt);
    return createdDate >= startOfToday;
  });

  let mergedCount = 0;
  let openCount = 0;
  let closedCount = 0;
  todayPullRequests.forEach((pr) => {
    if (pr.state === "closed" && pr.mergedAt) {
      mergedCount++;
    } else if (pr.state === "open") {
      openCount++;
    } else {
      closedCount++;
    }
  });

  // 7. Reviews needed
  const reviews = pullRequests.filter((pr) =>
    isPRNeedingReview(pr, githubUsernames),
  );

  // 8. Chart Data Calculation (last 7 calendar days)
  const chartData = calculateChartData(pullRequests, githubUsernames);

  return {
    integrations: JSON.parse(JSON.stringify(integrations)),
    issues: JSON.parse(JSON.stringify(issues)),
    pullRequests: JSON.parse(JSON.stringify(pullRequests)),
    userPullRequests: JSON.parse(JSON.stringify(userPullRequests)),
    myPRsThisMonthCount,
    todayStats: {
      merged: mergedCount,
      open: openCount,
      closed: closedCount,
      total: todayPullRequests.length,
    },
    reviews: JSON.parse(JSON.stringify(reviews)),
    chartData: JSON.parse(JSON.stringify(chartData)),
  };
};

const calculateChartData = (
  prs: IPullRequest[],
  usernames: string[],
) => {
  const byDateKey: Record<string, { prs: number; reviews: number }> = {};

  for (const pr of prs) {
    if (usernames.length === 0 || isAnyUser(pr.author, usernames)) {
      const createdKey = toLocalDateKey(pr.githubCreatedAt || pr.updatedAt);
      if (!byDateKey[createdKey]) {
        byDateKey[createdKey] = { prs: 0, reviews: 0 };
      }
      byDateKey[createdKey].prs++;
    } else if (
      !isAnyUser(pr.author, usernames) &&
      (pr.reviewRequested || pr.mentionedInDescription)
    ) {
      const reviewKey = toLocalDateKey(pr.githubCreatedAt || pr.updatedAt);
      if (!byDateKey[reviewKey]) {
        byDateKey[reviewKey] = { prs: 0, reviews: 0 };
      }
      byDateKey[reviewKey].reviews++;
    }
  }

  const data = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = toLocalDateKey(date);
    const label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    data.push({
      date: label,
      prs: byDateKey[key]?.prs || 0,
      reviews: byDateKey[key]?.reviews || 0,
    });
  }

  return data;
};
