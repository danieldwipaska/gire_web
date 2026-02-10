import { CircleDot, GitPullRequest, MessageSquareCode } from "lucide-react";
import SummaryCard from "../components/cards/SummaryCard";
import TaskIndex from "../components/indexes/TaskIndex";
import ChartIndex from "../components/indexes/ChartIndex";
import ReviewList from "../components/lists/ReviewList";
import IntegrationList from "../components/lists/IntegrationList";
import SyncButton from "../components/buttons/SyncButton";

const Dashboard = () => {
  return (
    <>
      <div className="min-h-screen container">
        <div className="flex justify-between">
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
        <div className="grid grid-cols-4 gap-6 my-6">
          <SummaryCard
            title="Today's PRs"
            desc="2 merged, 1 open"
            value="24"
            icon={
              <>
                <div className="w-12 h-12 bg-linear-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <GitPullRequest className="w-6 h-6 text-white" size={48} />
                </div>
              </>
            }
            footer={
              <>
                <span className="text-sm font-semibold text-green-400">
                  ↑ +2
                </span>
                <span className="text-white/60 text-sm">from last week</span>
              </>
            }
          />
          <SummaryCard
            title="To Review"
            desc="Awaiting your review"
            value="3"
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
            value="3"
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
            value="3"
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
          <TaskIndex />
        </div>

        {/* Analytics/Chart */}
        <div className="mb-6">
          <ChartIndex />
        </div>

        {/* Reviews & Integrations */}
        <div className="flex gap-6">
          <div className="flex-1">
            <ReviewList />
          </div>
          <div className="flex-1">
            <IntegrationList />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
