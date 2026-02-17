import { CircleDot, GitPullRequest, MessageSquareCode } from "lucide-react";
import SummaryCard from "../components/cards/SummaryCard";
import TaskIndex from "../components/indexes/TaskIndex";
import ChartIndex from "../components/indexes/ChartIndex";
import ReviewList from "../components/lists/ReviewList";
import IntegrationList from "../components/lists/IntegrationList";
import SyncButton from "../components/buttons/SyncButton";
import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import Integration from "@/models/Integration";
import { getStartDate } from "@/lib/dates";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const getIssues = async (userId: string) => {
  await connectDB();

  const issues = await Issue.find({
    updatedAt: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    userId: userId,
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  return issues;
};

const getPullRequests = async (userId: string) => {
  await connectDB();

  const pullRequests = await PullRequest.find({
    updatedAt: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    userId: userId,
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  return pullRequests;
};

const getMyPRsThisMonth = async (userId: string, githubUsername: string) => {
  await connectDB();

  const pullRequests = await PullRequest.find({
    updatedAt: {
      $gte: getStartDate("this-month"),
    },
    userId: userId,
    author: githubUsername,
  })
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();

  return pullRequests;
};

const getIntegrations = async (userId: string) => {
  await connectDB();

  const integrations = await Integration.find({
    userId: userId,
  }).lean();

  return integrations;
};

const getChartData = (prs: any[]) => {
  const prsAndReviewsByDate = prs.reduce((acc: any, pr: any) => {
    const date = pr.mergedAt ? pr.mergedAt.toDateString() : pr.updatedAt.toDateString();
    // only take month and date
    const monthDate = date.split(" ").slice(1, 3).join(" ");
    
    if (pr.reviewRequested || pr.mentionedInDescription) {
      if (!acc[monthDate]) {
        acc[monthDate] = { prs: 0, reviews: 0 };
      }
      acc[monthDate].reviews++;
    } else {
      if (!acc[monthDate]) {
        acc[monthDate] = { prs: 0, reviews: 0 };
      }
      acc[monthDate].prs++;
    }
    return acc;
  }, {});
  
  // convert object to array
  // all date based on calendar should be reported in the last 7 days
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const monthDate = date.toDateString().split(" ").slice(1, 3).join(" ");
    data.push({
      date: monthDate,
      prs: prsAndReviewsByDate[monthDate] ? prsAndReviewsByDate[monthDate].prs : 0,
      reviews: prsAndReviewsByDate[monthDate] ? prsAndReviewsByDate[monthDate].reviews : 0,
    });
  }

  return data;
};

const Dashboard = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Integrations
  const integrations = await getIntegrations(session.id);
  const serializedIntegrations = JSON.parse(JSON.stringify(integrations));

  // Issues
  const issues = await getIssues(session.id);
  const serializedIssues = JSON.parse(JSON.stringify(issues));

  // Pull Requests
  const pullRequests = await getPullRequests(session.id);
  const weeklyPullRequests = pullRequests.filter((pr: any) => {
    return pr.updatedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  });
  const todayPullRequests = pullRequests.filter((pr: any) => {
    return pr.updatedAt >= new Date(Date.now() - 24 * 60 * 60 * 1000);
  });
  let mergedCount = 0;
  let openCount = 0;

  todayPullRequests.forEach((pr: any) => {
    if (pr.state === "closed" && pr.mergedAt) {
      mergedCount++;
    } else {
      openCount++;
    }
  });

  const githubIntegration = integrations.find((integration: any) => integration.provider === "github");
  const userPullRequests = pullRequests.filter((pr: any) => {
    return pr.author === githubIntegration?.githubUsername;
  });
  const serializedPullRequests = JSON.parse(JSON.stringify(userPullRequests));

  // Reviews
  const reviews = pullRequests.filter((pr: any) => {
    return (pr.reviewRequested || pr.mentionedInDescription) && pr.state === "open";
  });
  const serializedReviews = JSON.parse(JSON.stringify(reviews));

  // Chart Data
  const chartData = getChartData(weeklyPullRequests);
  const serializedChartData = JSON.parse(JSON.stringify(chartData));

  // My PRs This Month
  const myPRsThisMonth = githubIntegration ? await getMyPRsThisMonth(session.id, githubIntegration.githubUsername) : [];

  return (
    <div className="min-h-screen container">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between">
        <div className="flex flex-col gap-2">
          <h2>Welcome, Daniel!</h2>
          <p className="text-lg text-white/70">
            Here&apos;s what you&apos;ve accomplished today
          </p>
        </div>
        <div className="flex gap-3 h-fit">
          <SyncButton />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
        <SummaryCard
          title="Today's PRs"
          desc={`${mergedCount} merged, ${openCount} open`}
          value={todayPullRequests.length}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <GitPullRequest className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
          footer={
            <>
              {/* <span className="text-sm font-semibold text-green-400">↑ +2</span>
              <span className="text-white/60 text-sm">from last week</span> */}
            </>
          }
        />
        <SummaryCard
          title="To Review"
          desc="Awaiting your review"
          value={reviews.length}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquareCode className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
        />
        <SummaryCard
          title="Open Issues"
          desc="Assigned to you"
          value={issues.length}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <CircleDot className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
        />
        <SummaryCard
          title="This Month"
          desc="Total PRs"
          value={myPRsThisMonth.length}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquareCode className="w-6 h-6 text-white" size={48} />
              </div>
            </>
          }
        />
      </div>

      {/* PRs & Issues */}
      <div className="mb-8">
        <TaskIndex issues={serializedIssues} pullRequests={serializedPullRequests} />
      </div>

      {/* Analytics/Chart */}
      <div className="mb-6">
        <ChartIndex data={serializedChartData} />
      </div>

      {/* Reviews & Integrations */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <ReviewList reviews={serializedReviews} isLoading={false} />
        </div>
        <div className="flex-1">
          <IntegrationList integrations={serializedIntegrations} isLoading={false} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
