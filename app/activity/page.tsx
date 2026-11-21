import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ActivityEvent from "@/models/ActivityEvent";
import Integration from "@/models/Integration";
import PullRequest from "@/models/PullRequest";
import { IActivityEvent, IPullRequest } from "@/lib/types";
import ActivityClient from "../components/activity/ActivityClient";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await connectDB();

  const [integration, events, pullRequests] = await Promise.all([
    Integration.findOne({ userId: session.id, provider: "github" })
      .select("githubUsername lastSync")
      .lean(),
    ActivityEvent.find({ userId: session.id })
      .sort({ occurredAt: -1 })
      .limit(1000)
      .lean(),
    PullRequest.find({ userId: session.id })
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean(),
  ]);

  return (
    <ActivityClient
      events={JSON.parse(JSON.stringify(events)) as IActivityEvent[]}
      pullRequests={JSON.parse(JSON.stringify(pullRequests)) as IPullRequest[]}
      githubUsername={integration?.githubUsername || null}
    />
  );
}

