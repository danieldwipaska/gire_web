"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CircleDot,
  Edit3,
  Figma,
  FileText,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  Laptop,
  ListTodo,
  MessageSquareCode,
  Trash2,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import {
  IActivityEvent,
  IFigmaLink,
  IIssue,
  INote,
  IProject,
  IPullRequest,
  ITask,
  ProjectCategory,
  ProjectStatus,
} from "@/lib/types";
import {
  getProjectReviewStatus,
  getTimeAgo,
  parseGitHubUrl,
} from "@/lib/utils";
import Button from "../buttons/Button";
import IssueCard from "../cards/IssueCard";
import PullRequestCard from "../cards/PullRequestCard";
import Modal from "../modals/Modal";
import { useDetailDrawer } from "../drawer/DetailDrawerProvider";
import FigmaEmbedViewer from "./FigmaEmbedViewer";

type TabKey = "github" | "reviews" | "figma" | "notes" | "members";
type ReviewFilter = "all" | "needs_review" | "reviewed";

export default function ProjectDetailClient({
  project,
  isOwner,
  isSuperUser = false,
  pullRequests,
  reviewPullRequests = [],
  issues,
  events,
  projectNotes,
  projectTasks,
  availableRepos,
}: {
  project: IProject;
  isOwner: boolean;
  isSuperUser?: boolean;
  pullRequests: IPullRequest[];
  reviewPullRequests?: IPullRequest[];
  issues: IIssue[];
  events: IActivityEvent[];
  projectNotes: INote[];
  projectTasks: ITask[];
  availableRepos: string[];
}) {
  const router = useRouter();
  const { openDetailByUrl } = useDetailDrawer();
  const [activeTab, setActiveTab] = useState<TabKey>("github");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [category, setCategory] = useState<ProjectCategory>(project.category);
  const [clientOrTeam, setClientOrTeam] = useState(project.clientOrTeam || "");
  const [description, setDescription] = useState(project.description || "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [selectedRepos, setSelectedRepos] = useState<string[]>(project.repos || []);
  const [customRepo, setCustomRepo] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);

  const patchProject = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update project");
    }
    router.refresh();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError("");
    try {
      await patchProject({
        name,
        category,
        clientOrTeam,
        description,
        status,
        repos: selectedRepos,
      });
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    const res = await fetch(`/api/projects/${project._id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/projects");
      router.refresh();
    }
  };

  const handleSaveFigmaLinks = async (nextLinks: IFigmaLink[]) => {
    await patchProject({ figmaLinks: nextLinks });
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setMemberLoading(true);
    setMemberError("");
    try {
      await patchProject({ addMemberEmail: inviteEmail.trim() });
      setInviteEmail("");
    } catch (err) {
      setMemberError(
        err instanceof Error ? err.message : "Failed to invite member",
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setMemberLoading(true);
    setMemberError("");
    try {
      await patchProject({ removeMemberId: userId });
    } catch (err) {
      setMemberError(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const CategoryIcon =
    project.category === "office"
      ? Briefcase
      : project.category === "freelance"
        ? Laptop
        : User;

  return (
    <div className="min-h-screen container space-y-6">
      {/* Breadcrumb & Header */}
      <div className="space-y-4 animate-fade-up">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-card border border-line rounded-3xl p-6 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-ink tracking-tight">
                {project.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-brand-violet/10 text-brand-violet border-brand-violet/25 flex items-center gap-1 capitalize">
                <CategoryIcon className="w-3 h-3" />
                {project.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-card text-ink border border-canvas">
                {project.status.replace("_", " ")}
              </span>
            </div>

            {project.clientOrTeam && (
              <p className="text-sm text-ink font-semibold">
                {project.clientOrTeam}
              </p>
            )}
            {project.description && (
              <p className="text-sm text-ink-muted max-w-3xl">
                {project.description}
              </p>
            )}

            {project.repos && project.repos.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <FolderGit2 className="w-3.5 h-3.5 text-ink-muted" />
                {project.repos.map((r) => (
                  <span
                    key={r}
                    className="px-2.5 py-0.5 rounded-full bg-highlight border border-line text-xs font-mono text-ink"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 bg-highlight hover:bg-white border border-line rounded-full text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Project
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full text-rose-600 cursor-pointer transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-card p-1 border border-line rounded-full w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("github")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "github"
              ? "bg-highlight text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5 text-brand-violet" />
          My GitHub Work ({pullRequests.length} PRs · {issues.length} Issues)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "reviews"
              ? "bg-highlight text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <MessageSquareCode className="w-3.5 h-3.5 text-brand-orchid" />
          Reviews ({reviewPullRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("figma")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "figma"
              ? "bg-highlight text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Figma className="w-3.5 h-3.5 text-brand-orchid" />
          Figma Preview ({project.figmaLinks?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "notes"
              ? "bg-highlight text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-brand-blue" />
          Notes &amp; Tasks ({projectNotes.length} · {projectTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "members"
              ? "bg-highlight text-ink shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-brand-mint-ink" />
          Members ({project.members?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "github" && (
        <div className="space-y-6 animate-fade-up">
          {project.repos.length === 0 ? (
            <div className="bg-card border border-dashed border-line-dashed rounded-3xl p-10 text-center space-y-2">
              <p className="text-sm font-bold text-ink">
                No GitHub repositories linked yet
              </p>
              <p className="text-xs text-ink-muted">
                Click &ldquo;Edit Project&rdquo; to attach repositories to this project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-brand-violet" />
                  My Pull Requests ({pullRequests.length})
                </h3>
                {pullRequests.length === 0 ? (
                  <p className="text-xs text-ink-muted">
                    No PRs authored by you for linked repositories.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                    {pullRequests.map((pr) => (
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
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-brand-blue-ink" />
                    Open Issues ({issues.length})
                  </h3>
                  {issues.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      No open issues for linked repositories.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                      {issues.map((issue) => (
                        <IssueCard
                          key={issue._id}
                          title={issue.title}
                          state={issue.state}
                          repoName={issue.repoName}
                          url={issue.url}
                          updatedAt={issue.updatedAt}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-brand-mint-ink" />
                    Recent Activity ({events.length})
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      No activity events yet for these repos.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {events.slice(0, 20).map((ev) => (
                        <div
                          key={ev._id}
                          onClick={() => {
                            if (parseGitHubUrl(ev.url)) {
                              openDetailByUrl(ev.url);
                            } else {
                              window.open(ev.url, "_blank", "noopener,noreferrer");
                            }
                          }}
                          className="bg-card border border-line rounded-2xl p-3 hover:border-brand-violet/45 hover:bg-highlight cursor-pointer transition-all"
                        >
                          <p className="text-xs font-bold text-ink truncate">
                            {ev.title}
                          </p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            {ev.type.replace(/_/g, " ")} •{" "}
                            <span suppressHydrationWarning>
                              {getTimeAgo(ev.occurredAt)}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (() => {
        const filteredReviews = reviewPullRequests.filter((pr) => {
          const rStatus = getProjectReviewStatus(pr);
          if (reviewFilter === "needs_review") return rStatus === "needs_review";
          if (reviewFilter === "reviewed") {
            return (
              rStatus === "approved" ||
              rStatus === "changes_requested" ||
              rStatus === "reviewed"
            );
          }
          return true;
        });

        const REVIEW_BADGE_META = {
          needs_review: {
            label: "Needs Review",
            cls: "bg-brand-orchid/15 text-brand-orchid-ink border-brand-orchid/30",
          },
          approved: {
            label: "Approved",
            cls: "bg-brand-mint/25 text-brand-mint-ink border-brand-mint/50",
          },
          changes_requested: {
            label: "Changes Requested",
            cls: "bg-rose-100 text-rose-700 border-rose-200",
          },
          reviewed: {
            label: "Reviewed",
            cls: "bg-brand-violet/12 text-brand-violet border-brand-violet/25",
          },
        } as const;

        return (
          <div className="space-y-4 animate-fade-up">
            {project.repos.length === 0 ? (
              <div className="bg-card border border-dashed border-line-dashed rounded-3xl p-10 text-center space-y-2">
                <p className="text-sm font-bold text-ink">
                  No GitHub repositories linked yet
                </p>
                <p className="text-xs text-ink-muted">
                  Click &ldquo;Edit Project&rdquo; to attach repositories to this project.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <MessageSquareCode className="w-4 h-4 text-brand-orchid" />
                    PR Reviews ({filteredReviews.length})
                  </h3>

                  <div className="flex items-center gap-1 bg-card p-1 border border-canvas rounded-full w-fit">
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "needs_review", label: "Needs Review" },
                        { id: "reviewed", label: "Reviewed / Approved" },
                      ] as const
                    ).map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setReviewFilter(pill.id)}
                        className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          reviewFilter === pill.id
                            ? "bg-highlight text-ink shadow-xs"
                            : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredReviews.length === 0 ? (
                  <div className="bg-card border border-line rounded-3xl p-8 text-center">
                    <p className="text-xs text-ink-muted">
                      No pull requests needing review or reviewed by you in this project yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredReviews.map((pr) => {
                      const rStatus =
                        getProjectReviewStatus(pr) || "needs_review";
                      const badge = REVIEW_BADGE_META[rStatus];
                      return (
                        <div key={pr._id} className="space-y-1.5">
                          <div className="flex items-center justify-end px-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <PullRequestCard
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {activeTab === "figma" && (
        <FigmaEmbedViewer
          figmaLinks={project.figmaLinks || []}
          onSaveLinks={handleSaveFigmaLinks}
        />
      )}

      {activeTab === "notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
          <div className="bg-card border border-line rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-violet" />
                Project Notes ({projectNotes.length})
              </h3>
              <Link
                href={`/notes?projectId=${project._id}`}
                className="px-3.5 py-1.5 bg-ink hover:bg-ink-hover rounded-full text-xs font-semibold text-white"
              >
                Open in Notes
              </Link>
            </div>
            {projectNotes.length === 0 ? (
              <p className="text-xs text-ink-muted">
                No notes linked to this project yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {projectNotes.map((note) => (
                  <Link
                    key={note._id}
                    href={`/notes?noteId=${note._id}`}
                    className="block bg-highlight border border-line hover:border-brand-violet/45 hover:bg-white rounded-2xl p-3.5 transition-all"
                  >
                    <p className="text-sm font-bold text-ink truncate">
                      {note.title}
                    </p>
                    {note.updatedAt && (
                      <p className="text-[11px] text-ink-muted mt-1" suppressHydrationWarning>
                        Updated {getTimeAgo(note.updatedAt)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-brand-mint-ink" />
                Project Delegated Tasks ({projectTasks.length})
              </h3>
              <Link
                href="/notes?tab=tasks"
                className="text-xs font-semibold text-brand-violet hover:text-brand-blue"
              >
                Manage All
              </Link>
            </div>
            {projectTasks.length === 0 ? (
              <p className="text-xs text-ink-muted">
                No tasks linked to this project yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {projectTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-highlight border border-canvas rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Assigned to {task.assignedToName} • {task.priority}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-card text-ink border border-canvas shrink-0">
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up">
          <div className="bg-card border border-line rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
            <h3 className="text-sm font-bold text-ink">
              Project Members
            </h3>
            <div className="space-y-2.5">
              {project.members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between gap-3 bg-highlight border border-canvas rounded-2xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-ink-muted truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-card text-ink border border-canvas">
                      {m.role}
                    </span>
                    {isSuperUser && isOwner && m.role !== "owner" && (
                      <button
                        type="button"
                        disabled={memberLoading}
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1 text-ink-subtle hover:text-rose-600 cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isSuperUser && (
          <div className="bg-card border border-line rounded-3xl p-5 space-y-4 h-fit shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-violet" />
              Invite Workspace Member
            </h3>
            <p className="text-xs text-ink-muted">
              Add members from this same Workspace by email to collaborate on this project.
            </p>
            {memberError && (
              <p className="text-xs text-rose-600 font-medium">{memberError}</p>
            )}
            <form onSubmit={handleInviteMember} className="flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="flex-1 px-3.5 py-2 bg-highlight border border-line rounded-full text-xs text-ink"
              />
              <Button type="submit" disabled={memberLoading}>
                {memberLoading ? "Adding..." : "Invite"}
              </Button>
            </form>
          </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Project"
        body={
          <form
            onSubmit={handleSaveEdit}
            className="flex flex-col gap-4 w-full max-w-lg max-h-[75vh] overflow-y-auto pr-1"
          >
            {editError && (
              <p className="text-xs text-rose-600 font-medium">{editError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-sm text-ink"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ProjectCategory)
                  }
                  className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-sm text-ink"
                >
                  <option value="office">Office</option>
                  <option value="freelance">Freelance</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Client / Team
                </label>
                <input
                  type="text"
                  value={clientOrTeam}
                  onChange={(e) => setClientOrTeam(e.target.value)}
                  className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-sm text-ink"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-sm text-ink"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-ink">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-sm text-ink"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-ink">
                Linked Repositories
              </label>
              {availableRepos.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-highlight border border-line rounded-2xl p-2 space-y-1">
                  {availableRepos.map((repo) => (
                    <label
                      key={repo}
                      className="flex items-center gap-2 text-xs text-ink px-2 py-1 hover:bg-card rounded-xl cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRepos.includes(repo)}
                        onChange={() =>
                          setSelectedRepos((prev) =>
                            prev.includes(repo)
                              ? prev.filter((r) => r !== repo)
                              : [...prev, repo],
                          )
                        }
                      />
                      <span className="font-mono">{repo}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRepo}
                  onChange={(e) => setCustomRepo(e.target.value)}
                  placeholder="Add repo (owner/repo)"
                  className="flex-1 px-3.5 py-1.5 bg-highlight border border-line rounded-full text-xs text-ink"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = customRepo.trim();
                    if (
                      trimmed &&
                      trimmed.includes("/") &&
                      !selectedRepos.includes(trimmed)
                    ) {
                      setSelectedRepos((prev) => [...prev, trimmed]);
                    }
                    setCustomRepo("");
                  }}
                  className="px-4 py-1.5 bg-card hover:bg-canvas rounded-full text-xs font-semibold text-ink cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        }
      />
    </div>
  );
}
