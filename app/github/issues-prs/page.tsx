import { CircleDot, GitPullRequest, MessageSquareCode } from "lucide-react";
import SummaryCard from "../../components/cards/SummaryCard";
import TaskIndex from "../../components/indexes/TaskIndex";
import ChartIndex from "../../components/indexes/ChartIndex";
import ReviewList from "../../components/lists/ReviewList";
import GitHubIntegrationPanel from "../../components/github/GitHubIntegrationPanel";
import SyncButton from "../../components/buttons/SyncButton";
import ContextFilterDropdown from "../../components/dropdowns/ContextFilterDropdown";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/dashboard-service";
import { getContextScope } from "@/lib/project-filter";
import { requirePageWorkspaceContext } from "@/lib/workspace";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GitHubIssuesAndPRsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await requirePageWorkspaceContext(session.id);

  const params = await searchParams;
  const contextParam =
    typeof params.context === "string" ? params.context : undefined;
  const projectParam =
    typeof params.project === "string" ? params.project : undefined;

  const { projects, allowedRepos } = await getContextScope(
    session.id,
    contextParam,
    projectParam,
    ctx.activeWorkspace._id,
  );

  const {
    integrations,
    issues,
    userPullRequests,
    myPRsThisMonthCount,
    todayStats,
    reviews,
    chartData,
  } = await getDashboardData(session.id, allowedRepos);

  return (
    <div className="min-h-screen container">
      <div className="relative z-40 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center animate-fade-up">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-ink tracking-tight">
            Issues &amp; Pull Requests
          </h2>
          <p className="text-sm text-ink-muted">
            Monitor your active pull requests, review requests, and assigned issues
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 h-fit">
          <ContextFilterDropdown projects={projects} />
          <SyncButton />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 my-6">
        <SummaryCard
          title="Today's PRs"
          desc={`${todayStats.merged} merged, ${todayStats.open} open${todayStats.closed ? `, ${todayStats.closed} closed` : ""}`}
          value={todayStats.total}
          icon={
            <div className="w-10 h-10 bg-brand-mint/25 border border-brand-mint/40 rounded-2xl flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-brand-mint-ink" />
            </div>
          }
        />
        <SummaryCard
          title="To Review"
          desc="Awaiting your review"
          value={reviews.length}
          icon={
            <div className="w-10 h-10 bg-brand-orchid/15 border border-brand-orchid/25 rounded-2xl flex items-center justify-center">
              <MessageSquareCode className="w-5 h-5 text-brand-orchid-ink" />
            </div>
          }
        />
        <SummaryCard
          title="Open Issues"
          desc="Assigned to you"
          value={issues.length}
          icon={
            <div className="w-10 h-10 bg-brand-blue/15 border border-brand-blue/25 rounded-2xl flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-brand-blue-ink" />
            </div>
          }
        />
        <SummaryCard
          title="This Month"
          desc="Total PRs created"
          value={myPRsThisMonthCount}
          icon={
            <div className="w-10 h-10 bg-brand-violet/12 border border-brand-violet/20 rounded-2xl flex items-center justify-center">
              <GitPullRequest className="w-5 h-5 text-brand-violet" />
            </div>
          }
        />
      </div>

      {/* PRs & Issues */}
      <div className="mb-8 animate-fade-up-delay-1">
        <TaskIndex
          issues={issues}
          pullRequests={userPullRequests}
          projects={projects}
          integrations={integrations}
        />
      </div>

      {/* Weekly Activity Chart */}
      <div className="mb-6 animate-fade-up-delay-2">
        <ChartIndex data={chartData} />
      </div>

      {/* Reviews & GitHub Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-up-delay-3">
        <div className="lg:col-span-7">
          <ReviewList
            reviews={reviews}
            isLoading={false}
            projects={projects}
            integrations={integrations}
          />
        </div>
        <div className="lg:col-span-5">
          <GitHubIntegrationPanel integrations={integrations} />
        </div>
      </div>
    </div>
  );
}
