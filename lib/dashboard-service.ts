import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import Integration from "@/models/Integration";
import { getStartDate } from "@/lib/dates";
import { IDashboardData, IIntegration, IIssue, IPullRequest } from "@/lib/types";

export const getDashboardData = async (userId: string): Promise<IDashboardData> => {
  await connectDB();

  // 1. Fetch Integrations
  const integrations: IIntegration[] = await Integration.find({ userId }).lean();
  const githubIntegration = integrations.find((i) => i.provider === "github");

  // 2. Fetch Issues
  const issues: IIssue[] = await Issue.find({
    updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    userId,
    state: "open",
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  // 3. Fetch Pull Requests (Last 30 days)
  const pullRequests: IPullRequest[] = await PullRequest.find({
    updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    userId,
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  // 4. Fetch My PRs This Month (if GitHub integration exists)
  let myPRsThisMonth: IPullRequest[] = [];
  if (githubIntegration) {
    myPRsThisMonth = await PullRequest.find({
      updatedAt: { $gte: getStartDate("this-month") },
      userId,
      author: githubIntegration.githubUsername,
      mentionedInDescription: false,
      reviewRequested: false,
    })
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean();
  }

  // 5. Process Data

  // Weekly & Today PRs
  const weeklyPullRequests = pullRequests.filter((pr) => {
    return new Date(pr.updatedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  });

  const todayPullRequests = pullRequests.filter((pr) => {
    return (new Date(pr.updatedAt).getTime() >= Date.now() - 24 * 60 * 60 * 1000) && !pr.mentionedInDescription && !pr.reviewRequested;
  });

  let mergedCount = 0;
  let openCount = 0;
  todayPullRequests.forEach((pr) => {
    if (pr.state === "closed" && pr.mergedAt) {
      mergedCount++;
    } else {
      openCount++;
    }
  });

  // User Specific PRs (Authored by user)
  const userPullRequests = pullRequests.filter((pr) => {
    return pr.author === githubIntegration?.githubUsername;
  });

  // Reviews needed
  const reviews = pullRequests.filter((pr) => {
    return (pr.reviewRequested || pr.mentionedInDescription) && pr.state === "open";
  });

  // Chart Data Calculation
  const chartData = calculateChartData(weeklyPullRequests);

  // Return everything needed for the dashboard
  return {
    integrations: JSON.parse(JSON.stringify(integrations)),
    issues: JSON.parse(JSON.stringify(issues)),
    pullRequests: JSON.parse(JSON.stringify(pullRequests)),
    userPullRequests: JSON.parse(JSON.stringify(userPullRequests)), // For TaskIndex
    myPRsThisMonthCount: myPRsThisMonth.length,
    todayStats: {
      merged: mergedCount,
      open: openCount,
      total: todayPullRequests.length,
    },
    reviews: JSON.parse(JSON.stringify(reviews)),
    chartData: JSON.parse(JSON.stringify(chartData)),
  };
};

// Helper for chart data
const calculateChartData = (prs: IPullRequest[]) => {
  const prsAndReviewsByDate = prs.reduce((acc: Record<string, { prs: number; reviews: number }>, pr) => {
    const date = pr.mergedAt
      ? new Date(pr.mergedAt).toDateString()
      : new Date(pr.updatedAt).toDateString();
    
    // only take month and date e.g. "Feb 18"
    const monthDate = date.split(" ").slice(1, 3).join(" ");

    if (!acc[monthDate]) {
      acc[monthDate] = { prs: 0, reviews: 0 };
    }

    if (pr.reviewRequested || pr.mentionedInDescription) {
      acc[monthDate].reviews++;
    } else {
      acc[monthDate].prs++;
    }
    return acc;
  }, {});

  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const monthDate = date.toDateString().split(" ").slice(1, 3).join(" ");
    data.push({
      date: monthDate,
      prs: prsAndReviewsByDate[monthDate]?.prs || 0,
      reviews: prsAndReviewsByDate[monthDate]?.reviews || 0,
    });
  }

  return data;
};
