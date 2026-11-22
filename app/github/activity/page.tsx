import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ActivityEvent from "@/models/ActivityEvent";
import Integration from "@/models/Integration";
import PullRequest from "@/models/PullRequest";
import { IActivityEvent, IPullRequest } from "@/lib/types";
import { getContextScope } from "@/lib/project-filter";
import ActivityClient from "../../components/activity/ActivityClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GitHubActivityPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const contextParam =
    typeof params.context === "string" ? params.context : undefined;
  const projectParam =
    typeof params.project === "string" ? params.project : undefined;

  await connectDB();

  const { projects, allowedRepos } = await getContextScope(
    session.id,
    contextParam,
    projectParam,
  );

  const repoFilter =
    allowedRepos !== null ? { repoName: { $in: allowedRepos } } : {};

  const [integrations, events, pullRequests] = await Promise.all([
    Integration.find({ userId: session.id, provider: "github" })
      .select("githubUsername lastSync")
      .lean(),
    ActivityEvent.find({ userId: session.id, ...repoFilter })
      .sort({ occurredAt: -1 })
      .limit(1000)
      .lean(),
    PullRequest.find({ userId: session.id, ...repoFilter })
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean(),
  ]);

  const githubUsernames = integrations
    .map((i) => i.githubUsername)
    .filter(Boolean);

  return (
    <ActivityClient
      events={JSON.parse(JSON.stringify(events)) as IActivityEvent[]}
      pullRequests={JSON.parse(JSON.stringify(pullRequests)) as IPullRequest[]}
      githubUsernames={githubUsernames}
      projects={projects}
    />
  );
}

