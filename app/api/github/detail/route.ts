import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { IGitHubCheckRun, IGitHubComment, IGitHubDetail } from "@/lib/types";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const kind = searchParams.get("kind");
    const repo = searchParams.get("repo");
    const numberStr = searchParams.get("number");
    const itemNumber = Number(numberStr);

    if (
      (kind !== "pr" && kind !== "issue") ||
      !repo ||
      !repo.includes("/") ||
      !Number.isInteger(itemNumber) ||
      itemNumber <= 0
    ) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    await connectDB();

    const githubIntegration = await Integration.findOne({
      userId: session.id,
      provider: "github",
    });

    if (!githubIntegration) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404 },
      );
    }

    const [owner, repoName] = repo.split("/");
    const octokit = new Octokit({ auth: githubIntegration.accessToken });

    if (kind === "pr") {
      const [prRes, filesRes, reviewsRes, commentsRes] = await Promise.all([
        octokit.rest.pulls.get({ owner, repo: repoName, pull_number: itemNumber }),
        octokit.rest.pulls.listFiles({
          owner,
          repo: repoName,
          pull_number: itemNumber,
          per_page: 60,
        }),
        octokit.rest.pulls.listReviews({
          owner,
          repo: repoName,
          pull_number: itemNumber,
          per_page: 50,
        }),
        octokit.rest.issues.listComments({
          owner,
          repo: repoName,
          issue_number: itemNumber,
          per_page: 50,
        }),
      ]);

      const pr = prRes.data;

      let checks: IGitHubCheckRun[] = [];
      try {
        const checksRes = await octokit.rest.checks.listForRef({
          owner,
          repo: repoName,
          ref: pr.head.sha,
          per_page: 30,
        });
        checks = checksRes.data.check_runs.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          conclusion: c.conclusion,
          htmlUrl: c.html_url ?? undefined,
        }));
      } catch {
        checks = [];
      }

      const timelineComments: IGitHubComment[] = [
        ...commentsRes.data.map((c) => ({
          id: c.id,
          user: c.user?.login || "unknown",
          avatarUrl: c.user?.avatar_url,
          body: c.body || "",
          createdAt: c.created_at,
          kind: "comment" as const,
        })),
        ...reviewsRes.data
          .filter((r) => r.body || r.state !== "COMMENTED")
          .map((r) => ({
            id: r.id,
            user: r.user?.login || "unknown",
            avatarUrl: r.user?.avatar_url,
            body: r.body || "",
            createdAt: r.submitted_at || pr.updated_at,
            kind: "review" as const,
            reviewState: r.state,
          })),
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      // Keep local PR cache updated
      await PullRequest.findOneAndUpdate(
        { userId: session.id, githubId: pr.id },
        {
          title: pr.title,
          state: pr.state,
          repoName: repo,
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
          comments: (pr.comments || 0) + (pr.review_comments || 0),
          url: pr.html_url,
          githubCreatedAt: pr.created_at,
          closedAt: pr.closed_at,
          mergedAt: pr.merged_at,
          updatedAt: pr.updated_at,
        },
      );

      const detail: IGitHubDetail = {
        kind: "pr",
        repo,
        number: pr.number,
        title: pr.title,
        body: pr.body || "",
        state: pr.state,
        merged: Boolean(pr.merged),
        draft: Boolean(pr.draft),
        url: pr.html_url,
        author: pr.user?.login || "unknown",
        authorAvatar: pr.user?.avatar_url,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
        labels: (pr.labels || []).map((l) => ({
          name: typeof l === "string" ? l : l.name || "",
          color: typeof l === "string" ? "64748b" : l.color || "64748b",
        })),
        assignees: (pr.assignees || []).map((a) => a.login),
        requestedReviewers: (pr.requested_reviewers || []).map((r) => r.login),
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        mergeable: pr.mergeable,
        mergeableState: pr.mergeable_state,
        comments: timelineComments,
        files: filesRes.data.map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
          patch: f.patch,
        })),
        checks,
      };

      return NextResponse.json(detail);
    }

    // Issue
    const [issueRes, commentsRes] = await Promise.all([
      octokit.rest.issues.get({ owner, repo: repoName, issue_number: itemNumber }),
      octokit.rest.issues.listComments({
        owner,
        repo: repoName,
        issue_number: itemNumber,
        per_page: 50,
      }),
    ]);

    const issue = issueRes.data;

    await Issue.findOneAndUpdate(
      { userId: session.id, githubId: issue.id },
      {
        title: issue.title,
        state: issue.state,
        repoName: repo,
        url: issue.html_url,
        githubCreatedAt: issue.created_at,
        closedAt: issue.closed_at,
        updatedAt: issue.updated_at,
        assignees: (issue.assignees || []).map((a) => a.login),
      },
    );

    const detail: IGitHubDetail = {
      kind: "issue",
      repo,
      number: issue.number,
      title: issue.title,
      body: issue.body || "",
      state: issue.state,
      merged: false,
      url: issue.html_url,
      author: issue.user?.login || "unknown",
      authorAvatar: issue.user?.avatar_url,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      labels: (issue.labels || []).map((l) => ({
        name: typeof l === "string" ? l : l.name || "",
        color: typeof l === "string" ? "64748b" : l.color || "64748b",
      })),
      assignees: (issue.assignees || []).map((a) => a.login),
      comments: commentsRes.data.map((c) => ({
        id: c.id,
        user: c.user?.login || "unknown",
        avatarUrl: c.user?.avatar_url,
        body: c.body || "",
        createdAt: c.created_at,
        kind: "comment",
      })),
    };

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching GitHub detail:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch GitHub detail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

