import { CircleDot, GitPullRequest, MessageSquareCode } from "lucide-react";
import SummaryCard from "../components/cards/SummaryCard";
import TaskIndex from "../components/indexes/TaskIndex";
import ChartIndex from "../components/indexes/ChartIndex";
import ReviewList from "../components/lists/ReviewList";
import IntegrationList from "../components/lists/IntegrationList";
import SyncButton from "../components/buttons/SyncButton";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard-service";

const Dashboard = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const {
    integrations,
    issues,
    userPullRequests,
    myPRsThisMonthCount,
    todayStats,
    reviews,
    chartData,
  } = await getDashboardData(session.id);

  return (
    <div className="min-h-screen container">
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">Welcome, {session.name || "User"}</h2>
          <p className="text-sm text-slate-400">
            Overview of your active pull requests, reviews, and issues
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
          desc={`${todayStats.merged} merged, ${todayStats.open} open`}
          value={todayStats.total}
          icon={
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-emerald-400" />
            </div>
          }
        />
        <SummaryCard
          title="To Review"
          desc="Awaiting your review"
          value={reviews.length}
          icon={
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
              <MessageSquareCode className="w-5 h-5 text-amber-400" />
            </div>
          }
        />
        <SummaryCard
          title="Open Issues"
          desc="Assigned to you"
          value={issues.length}
          icon={
            <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-sky-400" />
            </div>
          }
        />
        <SummaryCard
          title="This Month"
          desc="Total PRs created"
          value={myPRsThisMonthCount}
          icon={
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-indigo-400" />
            </div>
          }
        />
      </div>

      {/* PRs & Issues */}
      <div className="mb-8">
        <TaskIndex issues={issues} pullRequests={userPullRequests} />
      </div>

      {/* Analytics/Chart */}
      <div className="mb-6">
        <ChartIndex data={chartData} />
      </div>

      {/* Reviews & Integrations */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <ReviewList reviews={reviews} isLoading={false} />
        </div>
        <div className="flex-1">
          <IntegrationList integrations={integrations} isLoading={false} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
