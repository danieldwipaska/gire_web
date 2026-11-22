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
    <div className="bg-[#131924] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-100">GitHub Queue</h2>
          <Link
            href="/github/issues-prs"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            Open Issue &amp; PRs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[#0b0f19] p-1 border border-slate-800 rounded-xl w-fit mb-4">
          <button
            type="button"
            onClick={() => setTab("reviews")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "reviews"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            To Review ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("issues")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "issues"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            Issues Assigned ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("open_prs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "open_prs"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            My Open PRs ({openPullRequests.length})
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-auto pr-1">
          {tab === "reviews" &&
            (reviews.length === 0 ? (
              <p className="text-slate-400 text-sm py-4">
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
              <p className="text-slate-400 text-sm py-4">
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
              <p className="text-slate-400 text-sm py-4">
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

