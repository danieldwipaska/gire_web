"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  GitPullRequest,
  MessageSquareCode,
} from "lucide-react";
import { IIssue, IPullRequest } from "@/lib/types";
import IssueCard from "../cards/IssueCard";
import PullRequestCard from "../cards/PullRequestCard";

type QueueTab = "reviews" | "issues" | "open_prs";

export default function PriorityGitHubQueue({
  reviews,
  issues,
  openPullRequests,
}: {
  reviews: IPullRequest[];
  issues: IIssue[];
  openPullRequests: IPullRequest[];
}) {
  const [tab, setTab] = useState<QueueTab>(
    reviews.length > 0 ? "reviews" : issues.length > 0 ? "issues" : "open_prs",
  );

  return (
    <div className="bg-card border border-line rounded-3xl p-5 flex flex-col justify-between h-full shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-line">
          <h2 className="text-base font-bold text-ink tracking-tight">GitHub Queue</h2>
          <Link
            href="/github/issues-prs"
            className="text-xs font-semibold text-brand-violet hover:text-brand-blue inline-flex items-center gap-1"
          >
            Open Issue &amp; PRs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-canvas p-1 border border-line rounded-full w-fit mb-4">
          <button
            type="button"
            onClick={() => setTab("reviews")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "reviews"
                ? "bg-highlight text-ink shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-brand-orchid" />
            To Review ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("issues")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "issues"
                ? "bg-highlight text-ink shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <CircleDot className="w-3.5 h-3.5 text-brand-blue" />
            Issues Assigned ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("open_prs")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "open_prs"
                ? "bg-highlight text-ink shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-brand-violet" />
            My Open PRs ({openPullRequests.length})
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-auto pr-1">
          {tab === "reviews" &&
            (reviews.length === 0 ? (
              <p className="text-ink-muted text-sm py-4">
                No PRs awaiting your review.
              </p>
            ) : (
              reviews.slice(0, 8).map((pr) => (
                <PullRequestCard
                  key={pr._id}
                  title={pr.title}
                  state={pr.state}
                  repoName={pr.repoName}
                  additions={pr.additions}
                  deletions={pr.deletions}
                  comments={pr.comments}
                  url={pr.url}
                  updatedAt={pr.updatedAt}
                  mergedAt={pr.mergedAt}
                  author={pr.author}
                />
              ))
            ))}

          {tab === "issues" &&
            (issues.length === 0 ? (
              <p className="text-ink-muted text-sm py-4">
                No open issues assigned to you.
              </p>
            ) : (
              issues.slice(0, 8).map((issue) => (
                <IssueCard
                  key={issue._id}
                  title={issue.title}
                  state={issue.state}
                  repoName={issue.repoName}
                  url={issue.url}
                  updatedAt={issue.updatedAt}
                />
              ))
            ))}

          {tab === "open_prs" &&
            (openPullRequests.length === 0 ? (
              <p className="text-ink-muted text-sm py-4">
                No open pull requests right now.
              </p>
            ) : (
              openPullRequests.slice(0, 8).map((pr) => (
                <PullRequestCard
                  key={pr._id}
                  title={pr.title}
                  state={pr.state}
                  repoName={pr.repoName}
                  additions={pr.additions}
                  deletions={pr.deletions}
                  comments={pr.comments}
                  url={pr.url}
                  updatedAt={pr.updatedAt}
                  mergedAt={pr.mergedAt}
                  author={pr.author}
                />
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
