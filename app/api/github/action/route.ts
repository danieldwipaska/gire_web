import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ActivityEvent from "@/models/ActivityEvent";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import PullRequest from "@/models/PullRequest";
import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";

type ActionPayload = {
  kind: "pr" | "issue";
  repo: string;
  number: number;
  action: "comment" | "review" | "merge" | "close" | "reopen";
  body?: string;
  reviewEvent?: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  mergeMethod?: "merge" | "squash" | "rebase";
};

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: ActionPayload = await req.json();
    const { kind, repo, number, action, body, reviewEvent, mergeMethod } = payload;

    if (
      (kind !== "pr" && kind !== "issue") ||
      !repo ||
      !repo.includes("/") ||
      !Number.isInteger(number) ||
      number <= 0
    ) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
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
    const username = githubIntegration.githubUsername;

    if (action === "comment") {
      if (!body?.trim()) {
        return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
      }
      await octokit.rest.issues.createComment({
        owner,
        repo: repoName,
        issue_number: number,
        body: body.trim(),
      });

      const url = `https://github.com/${repo}/${kind === "pr" ? "pull" : "issues"}/${number}`;
      await ActivityEvent.create({
        userId: session.id,
        githubEventId: `gire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: kind === "pr" ? "pr_commented" : "issue_commented",
        rawType: "IssueCommentEvent",
        action: "created",
        actor: username,
        repoName: repo,
        targetType: kind,
        targetNumber: number,
        title: `${kind === "pr" ? "PR" : "Issue"} #${number}`,
        description: body.trim().slice(0, 140),
        url,
        occurredAt: new Date(),
      });

      return NextResponse.json({ message: "Comment posted" });
    }

    if (kind === "pr" && action === "review") {
      const event = reviewEvent || "COMMENT";
      if (event !== "APPROVE" && !body?.trim()) {
        return NextResponse.json(
          { error: "Review comment is required for this review type" },
          { status: 400 },
        );
      }

      await octokit.rest.pulls.createReview({
        owner,
        repo: repoName,
        pull_number: number,
        event,
        body: body?.trim() || undefined,
      });

      const { data: updatedPr } = await octokit.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: number,
      });

      await PullRequest.findOneAndUpdate(
        { userId: session.id, githubId: updatedPr.id },
        {
          reviewedByMe: true,
          reviewRequested: false,
          updatedAt: updatedPr.updated_at,
          comments: (updatedPr.comments || 0) + (updatedPr.review_comments || 0),
        },
      );

      await ActivityEvent.create({
        userId: session.id,
        githubEventId: `gire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "pr_reviewed",
        rawType: "PullRequestReviewEvent",
        action: "submitted",
        actor: username,
        repoName: repo,
        targetType: "pr",
        targetNumber: number,
        title: updatedPr.title,
        description: body?.trim()
          ? `${event.toLowerCase().replace(/_/g, " ")}: ${body.trim().slice(0, 120)}`
          : `Submitted review (${event.toLowerCase().replace(/_/g, " ")})`,
        url: updatedPr.html_url,
        occurredAt: new Date(),
      });

      return NextResponse.json({ message: "Review submitted" });
    }

    if (kind === "pr" && action === "merge") {
      await octokit.rest.pulls.merge({
        owner,
        repo: repoName,
        pull_number: number,
        merge_method: mergeMethod || "merge",
      });

      const { data: updatedPr } = await octokit.rest.pulls.get({
        owner,
        repo: repoName,
        pull_number: number,
      });

      await PullRequest.findOneAndUpdate(
        { userId: session.id, githubId: updatedPr.id },
        {
          state: updatedPr.state,
          mergedAt: updatedPr.merged_at,
          closedAt: updatedPr.closed_at,
          updatedAt: updatedPr.updated_at,
        },
      );

      await ActivityEvent.create({
        userId: session.id,
        githubEventId: `gire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "pr_merged",
        rawType: "PullRequestEvent",
        action: "closed",
        actor: username,
        repoName: repo,
        targetType: "pr",
        targetNumber: number,
        title: updatedPr.title,
        description: `Merged pull request (${mergeMethod || "merge"})`,
        url: updatedPr.html_url,
        occurredAt: new Date(),
      });

      return NextResponse.json({ message: "Pull request merged" });
    }

    if (action === "close" || action === "reopen") {
      const nextState = action === "close" ? "closed" : "open";

      if (kind === "pr") {
        const { data: updatedPr } = await octokit.rest.pulls.update({
          owner,
          repo: repoName,
          pull_number: number,
          state: nextState,
        });

        await PullRequest.findOneAndUpdate(
          { userId: session.id, githubId: updatedPr.id },
          {
            state: updatedPr.state,
            closedAt: updatedPr.closed_at,
            updatedAt: updatedPr.updated_at,
          },
        );

        await ActivityEvent.create({
          userId: session.id,
          githubEventId: `gire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: action === "close" ? "pr_closed" : "pr_updated",
          rawType: "PullRequestEvent",
          action: action === "close" ? "closed" : "reopened",
          actor: username,
          repoName: repo,
          targetType: "pr",
          targetNumber: number,
          title: updatedPr.title,
          description:
            action === "close" ? "Closed pull request" : "Reopened pull request",
          url: updatedPr.html_url,
          occurredAt: new Date(),
        });
      } else {
        const { data: updatedIssue } = await octokit.rest.issues.update({
          owner,
          repo: repoName,
          issue_number: number,
          state: nextState,
        });

        await Issue.findOneAndUpdate(
          { userId: session.id, githubId: updatedIssue.id },
          {
            state: updatedIssue.state,
            closedAt: updatedIssue.closed_at,
            updatedAt: updatedIssue.updated_at,
          },
        );

        await ActivityEvent.create({
          userId: session.id,
          githubEventId: `gire-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: action === "close" ? "issue_closed" : "issue_opened",
          rawType: "IssuesEvent",
          action: action === "close" ? "closed" : "reopened",
          actor: username,
          repoName: repo,
          targetType: "issue",
          targetNumber: number,
          title: updatedIssue.title,
          description: action === "close" ? "Closed issue" : "Reopened issue",
          url: updatedIssue.html_url,
          occurredAt: new Date(),
        });
      }

      return NextResponse.json({
        message: `${kind === "pr" ? "Pull request" : "Issue"} ${nextState}`,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Error performing GitHub action:", error);
    const message =
      error instanceof Error ? error.message : "Failed to perform GitHub action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

