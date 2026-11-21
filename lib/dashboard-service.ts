import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import Integration from "@/models/Integration";
import { getStartDate, getStartOfToday, toLocalDateKey } from "@/lib/dates";
import { IDashboardData, IIntegration, IIssue, IPullRequest } from "@/lib/types";
import { isIssueAssignedTo, isPRNeedingReview, isSameUser } from "@/lib/utils";

export const getDashboardData = async (userId: string): Promise<IDashboardData> => {
  await connectDB();

  // 1. Fetch Integrations
  const integrations: IIntegration[] = await Integration.find({ userId })
    .select("-accessToken")
    .lean();
  const githubIntegration = integrations.find((i) => i.provider === "github");
  const githubUsername = githubIntegration?.githubUsername;

  // 2. Fetch Open Issues (all open issues assigned to user, not limited to 30 days)
  const rawOpenIssues: IIssue[] = await Issue.find({
    userId,
    state: "open",
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  const issues = githubUsername
    ? rawOpenIssues.filter((issue) => isIssueAssignedTo(issue, githubUsername))
    : rawOpenIssues;

  // 3. Fetch Pull Requests (last 30 days by createdAt/updatedAt OR still open for reviews)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const pullRequests: IPullRequest[] = await PullRequest.find({
    userId,
    $or: [
      { updatedAt: { $gte: thirtyDaysAgo } },
      { githubCreatedAt: { $gte: thirtyDaysAgo } },
      { state: "open" },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  // 4. User Specific PRs (Authored by user, case-insensitive)
  const userPullRequests = pullRequests.filter((pr) =>
    isSameUser(pr.author, githubUsername),
  );

  // 5. My PRs Created This Month (based on githubCreatedAt)
  const startOfMonth = getStartDate("this-month");
  let myPRsThisMonthCount = 0;
  if (githubUsername) {
    const myPRsThisYear: IPullRequest[] = await PullRequest.find({
      userId,
      $or: [
        { githubCreatedAt: { $gte: startOfMonth } },
        { githubCreatedAt: { $exists: false }, updatedAt: { $gte: startOfMonth } },
      ],
    })
      .select("author githubCreatedAt updatedAt")
      .lean();

    myPRsThisMonthCount = myPRsThisYear.filter((pr) =>
      isSameUser(pr.author, githubUsername),
    ).length;
  }

  // 6. Today's PRs authored by user (created today since 00:00 local time)
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

  // 7. Reviews needed (Open PRs authored by someone else, actively needing review)
  const reviews = pullRequests.filter((pr) =>
    isPRNeedingReview(pr, githubUsername),
  );

  // 8. Chart Data Calculation (last 7 calendar days)
  const chartData = calculateChartData(pullRequests, githubUsername);

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

// Helper for 7-day activity chart
const calculateChartData = (prs: IPullRequest[], username?: string) => {
  const byDateKey: Record<string, { prs: number; reviews: number }> = {};

  for (const pr of prs) {
    if (!username || isSameUser(pr.author, username)) {
      const createdKey = toLocalDateKey(pr.githubCreatedAt || pr.updatedAt);
      if (!byDateKey[createdKey]) {
        byDateKey[createdKey] = { prs: 0, reviews: 0 };
      }
      byDateKey[createdKey].prs++;
    } else if (
      !isSameUser(pr.author, username) &&
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
