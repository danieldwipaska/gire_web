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
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between">
        <div className="flex flex-col gap-2">
          <h2>Welcome, {session.name || "User"}!</h2>
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
          desc={`${todayStats.merged} merged, ${todayStats.open} open`}
          value={todayStats.total}
          icon={
            <>
              <div className="w-12 h-12 bg-linear-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <GitPullRequest className="w-6 h-6 text-white" size={48} />
              </div>
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
          value={myPRsThisMonthCount}
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
