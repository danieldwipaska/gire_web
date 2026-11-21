"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock,
  ExternalLink,
  FileCode2,
  GitBranch,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { IGitHubDetail } from "@/lib/types";
import { getTimeAgo, parseGitHubUrl } from "@/lib/utils";
import Spinner from "../spinners/Spinner";

interface DrawerTarget {
  kind: "pr" | "issue";
  repo: string;
  number: number;
}

interface DetailDrawerContextValue {
  openDetail: (target: DrawerTarget) => void;
  openDetailByUrl: (url: string) => boolean;
  closeDetail: () => void;
}

const DetailDrawerContext = createContext<DetailDrawerContextValue | null>(null);

export const useDetailDrawer = () => {
  const ctx = useContext(DetailDrawerContext);
  if (!ctx) {
    throw new Error("useDetailDrawer must be used within DetailDrawerProvider");
  }
  return ctx;
};

const renderDiffLines = (patch?: string) => {
  if (!patch) {
    return (
      <p className="text-xs text-slate-500 italic p-3">
        Diff preview not available for this file (binary or too large).
      </p>
    );
  }

  return (
    <pre className="text-xs font-mono overflow-x-auto p-3 leading-5 bg-[#090d16]">
      {patch.split("\n").map((line, idx) => {
        let lineClass = "text-slate-300";
        if (line.startsWith("+") && !line.startsWith("+++")) {
          lineClass = "bg-emerald-950/50 text-emerald-300";
        } else if (line.startsWith("-") && !line.startsWith("---")) {
          lineClass = "bg-rose-950/50 text-rose-300";
        } else if (line.startsWith("@@")) {
          lineClass = "bg-indigo-950/40 text-indigo-300";
        }
        return (
          <div key={idx} className={`px-2 whitespace-pre ${lineClass}`}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
};

export function DetailDrawerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<DrawerTarget | null>(null);
  const [detail, setDetail] = useState<IGitHubDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "files">("overview");
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Action states
  const [commentBody, setCommentBody] = useState("");
  const [reviewMode, setReviewMode] = useState<"COMMENT" | "APPROVE" | "REQUEST_CHANGES">("COMMENT");
  const [mergeMethod, setMergeMethod] = useState<"merge" | "squash" | "rebase">("squash");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchDetail = useCallback(async (t: DrawerTarget) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        kind: t.kind,
        repo: t.repo,
        number: String(t.number),
      });
      const res = await fetch(`/api/github/detail?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load details");
      }
      setDetail(data);
      // Auto-expand first 3 changed files
      if (Array.isArray(data.files)) {
        const initialExpanded: Record<string, boolean> = {};
        data.files.slice(0, 3).forEach((f: { filename: string }) => {
          initialExpanded[f.filename] = true;
        });
        setExpandedFiles(initialExpanded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  }, []);

  const openDetail = useCallback(
    (nextTarget: DrawerTarget) => {
      setTarget(nextTarget);
      setDetail(null);
      setActiveTab("overview");
      setCommentBody("");
      setReviewMode("COMMENT");
      setActionFeedback(null);
      void fetchDetail(nextTarget);
    },
    [fetchDetail],
  );

  const openDetailByUrl = useCallback(
    (url: string) => {
      const parsed = parseGitHubUrl(url);
      if (!parsed) return false;
      openDetail(parsed);
      return true;
    },
    [openDetail],
  );

  const closeDetail = useCallback(() => {
    setTarget(null);
    setDetail(null);
    setError("");
    setActionFeedback(null);
  }, []);

  useEffect(() => {
    if (!target) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [target, closeDetail]);

  const performAction = async (
    action: "comment" | "review" | "merge" | "close" | "reopen",
  ) => {
    if (!target) return;
    setActionLoading(true);
    setActionFeedback(null);

    try {
      const res = await fetch("/api/github/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: target.kind,
          repo: target.repo,
          number: target.number,
          action,
          body: commentBody,
          reviewEvent: reviewMode,
          mergeMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setActionFeedback({
        type: "success",
        text: data.message || "Action completed",
      });
      if (action === "comment" || action === "review") {
        setCommentBody("");
      }
      await fetchDetail(target);
      router.refresh();
    } catch (err) {
      setActionFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Action failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (() => {
    if (!detail) return null;
    if (detail.merged) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase bg-purple-950/60 text-purple-300 border border-purple-700/50">
          Merged
        </span>
      );
    }
    if (detail.state === "open") {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
          {detail.draft ? "Draft" : "Open"}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase bg-rose-950/60 text-rose-300 border border-rose-700/50">
        Closed
      </span>
    );
  })();

  return (
    <DetailDrawerContext.Provider
      value={{ openDetail, openDetailByUrl, closeDetail }}
    >
      {children}

      {/* Backdrop & Slide-over Drawer */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
          onClick={closeDetail}
        >
          <aside
            className="relative w-full max-w-3xl h-full bg-[#0e1420] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-[#131924]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  {target.kind === "pr" ? (
                    <GitPullRequest className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <CircleDot className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 truncate">
                      {target.repo}
                    </span>
                    <span>•</span>
                    <span>#{target.number}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {detail?.url && (
                  <a
                    href={detail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    Open on GitHub
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={closeDetail}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Spinner size={3} />
                  <p className="text-sm text-slate-400">
                    Loading {target.kind === "pr" ? "pull request" : "issue"} from GitHub...
                  </p>
                </div>
              ) : error ? (
                <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 text-sm text-rose-300">
                  {error}
                </div>
              ) : detail ? (
                <>
                  {/* Title & Meta */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-slate-100 leading-snug">
                        {detail.title}
                      </h3>
                      {statusBadge}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>
                        by <strong className="text-slate-200">@{detail.author}</strong>
                      </span>
                      <span>•</span>
                      <span suppressHydrationWarning>
                        updated {getTimeAgo(detail.updatedAt)}
                      </span>
                      {detail.kind === "pr" && detail.headBranch && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/70 text-slate-300 font-mono">
                            <GitBranch className="w-3 h-3 text-indigo-400" />
                            {detail.headBranch} → {detail.baseBranch}
                          </span>
                        </>
                      )}
                      {detail.kind === "pr" && (
                        <span className="flex items-center gap-2 font-semibold">
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Plus className="w-3 h-3" />
                            {detail.additions ?? 0}
                          </span>
                          <span className="text-rose-400 flex items-center gap-0.5">
                            <Minus className="w-3 h-3" />
                            {detail.deletions ?? 0}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Labels & Checks */}
                    {(detail.labels.length > 0 ||
                      (detail.checks && detail.checks.length > 0)) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {detail.labels.map((label) => (
                          <span
                            key={label.name}
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-slate-700 bg-slate-800/70 text-slate-200"
                          >
                            {label.name}
                          </span>
                        ))}
                        {detail.checks?.map((c) => {
                          const isSuccess = c.conclusion === "success";
                          const isFailure =
                            c.conclusion === "failure" ||
                            c.conclusion === "timed_out";
                          return (
                            <span
                              key={c.id}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 ${
                                isSuccess
                                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                                  : isFailure
                                    ? "bg-rose-950/40 text-rose-300 border-rose-800/50"
                                    : "bg-amber-950/40 text-amber-300 border-amber-800/50"
                              }`}
                            >
                              {isSuccess ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : isFailure ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {c.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tabs for PRs */}
                  {detail.kind === "pr" && (
                    <div className="flex items-center gap-1 bg-[#131924] p-1 border border-slate-800 rounded-xl w-fit">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "overview"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Overview & Review ({detail.comments.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("files")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "files"
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <FileCode2 className="w-3.5 h-3.5" />
                        Files Changed ({detail.files?.length ?? detail.changedFiles ?? 0})
                      </button>
                    </div>
                  )}

                  {activeTab === "overview" ? (
                    <div className="space-y-5">
                      {/* Description */}
                      <div className="bg-[#131924] border border-slate-800/80 rounded-xl p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Description
                        </p>
                        {detail.body ? (
                          <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed break-words">
                            {detail.body}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            No description provided.
                          </p>
                        )}
                      </div>

                      {/* Timeline of Comments & Reviews */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Conversation ({detail.comments.length})
                        </p>
                        {detail.comments.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No comments or reviews yet.
                          </p>
                        ) : (
                          detail.comments.map((c) => (
                            <div
                              key={`${c.kind}-${c.id}`}
                              className="bg-[#131924] border border-slate-800/80 rounded-xl p-4 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-200">
                                    @{c.user}
                                  </span>
                                  {c.kind === "review" && c.reviewState && (
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        c.reviewState === "APPROVED"
                                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/40"
                                          : c.reviewState === "CHANGES_REQUESTED"
                                            ? "bg-rose-950/60 text-rose-300 border border-rose-700/40"
                                            : "bg-slate-800 text-slate-300"
                                      }`}
                                    >
                                      {c.reviewState.replace(/_/g, " ")}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className="text-slate-500"
                                  suppressHydrationWarning
                                >
                                  {getTimeAgo(c.createdAt)}
                                </span>
                              </div>
                              {c.body && (
                                <div className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                                  {c.body}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Action Box */}
                      <div className="bg-[#131924] border border-slate-800 rounded-xl p-4 space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Actions
                        </p>

                        {actionFeedback && (
                          <div
                            className={`text-xs rounded-lg p-3 border ${
                              actionFeedback.type === "success"
                                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                                : "bg-rose-950/40 border-rose-800/60 text-rose-300"
                            }`}
                          >
                            {actionFeedback.text}
                          </div>
                        )}

                        <textarea
                          rows={3}
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          placeholder={
                            detail.kind === "pr"
                              ? "Write a comment or review feedback..."
                              : "Write a comment on this issue..."
                          }
                          className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {detail.kind === "pr" && detail.state === "open" ? (
                              <>
                                <select
                                  value={reviewMode}
                                  onChange={(e) =>
                                    setReviewMode(
                                      e.target.value as
                                        | "COMMENT"
                                        | "APPROVE"
                                        | "REQUEST_CHANGES",
                                    )
                                  }
                                  className="bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                                >
                                  <option value="COMMENT">Comment</option>
                                  <option value="APPROVE">Approve PR</option>
                                  <option value="REQUEST_CHANGES">
                                    Request Changes
                                  </option>
                                </select>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    performAction(
                                      reviewMode === "COMMENT" ? "comment" : "review",
                                    )
                                  }
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  {reviewMode === "APPROVE" ? (
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                  {reviewMode === "COMMENT"
                                    ? "Post Comment"
                                    : reviewMode === "APPROVE"
                                      ? "Submit Approval"
                                      : "Request Changes"}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={actionLoading || !commentBody.trim()}
                                onClick={() => performAction("comment")}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Post Comment
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {detail.kind === "pr" && detail.state === "open" && (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={mergeMethod}
                                  onChange={(e) =>
                                    setMergeMethod(
                                      e.target.value as
                                        | "merge"
                                        | "squash"
                                        | "rebase",
                                    )
                                  }
                                  className="bg-[#0b0f19] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                                >
                                  <option value="squash">Squash</option>
                                  <option value="merge">Merge</option>
                                  <option value="rebase">Rebase</option>
                                </select>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => performAction("merge")}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <GitMerge className="w-3.5 h-3.5" />
                                  Merge
                                </button>
                              </div>
                            )}

                            {!detail.merged && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() =>
                                  performAction(
                                    detail.state === "open" ? "close" : "reopen",
                                  )
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer disabled:opacity-50 ${
                                  detail.state === "open"
                                    ? "bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-800/60"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                                }`}
                              >
                                {detail.state === "open" ? "Close" : "Reopen"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Files Changed Tab */
                    <div className="space-y-3">
                      {!detail.files || detail.files.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No changed files found.
                        </p>
                      ) : (
                        detail.files.map((file) => {
                          const isExpanded = Boolean(expandedFiles[file.filename]);
                          return (
                            <div
                              key={file.filename}
                              className="border border-slate-800 rounded-xl overflow-hidden bg-[#131924]"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedFiles((prev) => ({
                                    ...prev,
                                    [file.filename]: !prev[file.filename],
                                  }))
                                }
                                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-800/50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <span className="text-xs font-mono text-slate-200 truncate">
                                    {file.filename}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                                  <span className="text-emerald-400">
                                    +{file.additions}
                                  </span>
                                  <span className="text-rose-400">
                                    -{file.deletions}
                                  </span>
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="border-t border-slate-800">
                                  {renderDiffLines(file.patch)}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </DetailDrawerContext.Provider>
  );
}

