import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { requirePageWorkspaceContext } from "@/lib/workspace";
import ActivityEvent from "@/models/ActivityEvent";
import Issue from "@/models/Issue";
import Project from "@/models/Project";
import PullRequest from "@/models/PullRequest";
import { IProject } from "@/lib/types";
import ProjectsClient from "../components/projects/ProjectsClient";

export default async function ProjectsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await requirePageWorkspaceContext(session.id);

  await connectDB();

  const [projectsRaw, openPrRepos, openIssueRepos, prDistinct, issueDistinct, eventDistinct] =
    await Promise.all([
      Project.find({
        workspaceId: ctx.activeWorkspace._id,
      })
        .sort({ updatedAt: -1 })
        .lean(),
      PullRequest.find({ userId: session.id })
        .select("repoName state mergedAt")
        .lean(),
      Issue.find({ userId: session.id, state: "open" })
        .select("repoName")
        .lean(),
      PullRequest.distinct("repoName", { userId: session.id }),
      Issue.distinct("repoName", { userId: session.id }),
      ActivityEvent.distinct("repoName", { userId: session.id }),
    ]);

  const availableRepos = Array.from(
    new Set(
      [...prDistinct, ...issueDistinct, ...eventDistinct].filter(
        (r): r is string => typeof r === "string" && r.includes("/"),
      ),
    ),
  ).sort();

  // Precompute stats per repo
  const repoStats = new Map<
    string,
    { openPRs: number; mergedPRs: number; openIssues: number }
  >();
  const ensureRepo = (repo: string) => {
    if (!repoStats.has(repo)) {
      repoStats.set(repo, { openPRs: 0, mergedPRs: 0, openIssues: 0 });
    }
    return repoStats.get(repo)!;
  };

  for (const pr of openPrRepos) {
    if (!pr.repoName) continue;
    const s = ensureRepo(pr.repoName);
    if (pr.state === "open") s.openPRs++;
    else if (pr.mergedAt) s.mergedPRs++;
  }
  for (const issue of openIssueRepos) {
    if (!issue.repoName) continue;
    ensureRepo(issue.repoName).openIssues++;
  }

  const projects = (JSON.parse(JSON.stringify(projectsRaw)) as IProject[]).map(
    (p) => {
      let openPRs = 0;
      let mergedPRs = 0;
      let openIssues = 0;
      for (const r of p.repos || []) {
        const s = repoStats.get(r);
        if (s) {
          openPRs += s.openPRs;
          mergedPRs += s.mergedPRs;
          openIssues += s.openIssues;
        }
      }
      return {
        ...p,
        stats: { openPRs, mergedPRs, openIssues },
      };
    },
  );

  return (
    <ProjectsClient projects={projects} availableRepos={availableRepos} />
  );
}

