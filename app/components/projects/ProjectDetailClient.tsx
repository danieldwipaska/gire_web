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
import { getTimeAgo, parseGitHubUrl } from "@/lib/utils";
import Button from "../buttons/Button";
import IssueCard from "../cards/IssueCard";
import PullRequestCard from "../cards/PullRequestCard";
import Modal from "../modals/Modal";
import { useDetailDrawer } from "../drawer/DetailDrawerProvider";
import FigmaEmbedViewer from "./FigmaEmbedViewer";

type TabKey = "github" | "figma" | "notes" | "members";

export default function ProjectDetailClient({
  project,
  isOwner,
  pullRequests,
  issues,
  events,
  projectNotes,
  projectTasks,
  availableRepos,
}: {
  project: IProject;
  isOwner: boolean;
  pullRequests: IPullRequest[];
  issues: IIssue[];
  events: IActivityEvent[];
  projectNotes: INote[];
  projectTasks: ITask[];
  availableRepos: string[];
}) {
  const router = useRouter();
  const { openDetailByUrl } = useDetailDrawer();
  const [activeTab, setActiveTab] = useState<TabKey>("github");

  // Edit Modal state
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

  // Member invite state
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
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-[#131924] border border-slate-800/80 rounded-2xl p-6">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-100">
                {project.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold border bg-indigo-950/60 text-indigo-300 border-indigo-700/50 flex items-center gap-1 capitalize">
                <CategoryIcon className="w-3 h-3" />
                {project.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                {project.status.replace("_", " ")}
              </span>
            </div>

            {project.clientOrTeam && (
              <p className="text-sm text-slate-300 font-medium">
                {project.clientOrTeam}
              </p>
            )}
            {project.description && (
              <p className="text-sm text-slate-400 max-w-3xl">
                {project.description}
              </p>
            )}

            {project.repos && project.repos.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                {project.repos.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 text-xs font-mono text-slate-300"
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
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Project
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="p-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 rounded-lg text-rose-300 cursor-pointer"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-[#131924] p-1 border border-slate-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("github")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "github"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          GitHub Work ({pullRequests.length} PRs · {issues.length} Issues)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("figma")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "figma"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Figma className="w-3.5 h-3.5 text-pink-400" />
          Figma Preview ({project.figmaLinks?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "notes"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          Notes & Tasks ({projectNotes.length} · {projectTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "members"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Members ({project.members?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "github" && (
        <div className="space-y-6">
          {project.repos.length === 0 ? (
            <div className="bg-[#131924] border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-200">
                No GitHub repositories linked yet
              </p>
              <p className="text-xs text-slate-400">
                Click &ldquo;Edit Project&rdquo; to attach repositories to this project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <GitPullRequest className="w-4 h-4 text-indigo-400" />
                  Pull Requests ({pullRequests.length})
                </h3>
                {pullRequests.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No synced PRs for linked repositories.
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
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-sky-400" />
                    Open Issues ({issues.length})
                  </h3>
                  {issues.length === 0 ? (
                    <p className="text-xs text-slate-500">
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
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-400" />
                    Recent Activity ({events.length})
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-xs text-slate-500">
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
                          className="bg-[#131924] border border-slate-800 rounded-xl p-3 hover:border-indigo-500/40 cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {ev.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
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

      {activeTab === "figma" && (
        <FigmaEmbedViewer
          figmaLinks={project.figmaLinks || []}
          onSaveLinks={handleSaveFigmaLinks}
        />
      )}

      {activeTab === "notes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Project Notes ({projectNotes.length})
              </h3>
              <Link
                href={`/notes?projectId=${project._id}`}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white"
              >
                Open in Notes
              </Link>
            </div>
            {projectNotes.length === 0 ? (
              <p className="text-xs text-slate-500">
                No notes linked to this project yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {projectNotes.map((note) => (
                  <Link
                    key={note._id}
                    href={`/notes?noteId=${note._id}`}
                    className="block bg-[#0b0f19] border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3.5 transition-colors"
                  >
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {note.title}
                    </p>
                    {note.updatedAt && (
                      <p className="text-[11px] text-slate-500 mt-1" suppressHydrationWarning>
                        Updated {getTimeAgo(note.updatedAt)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                Project Delegated Tasks ({projectTasks.length})
              </h3>
              <Link
                href="/notes?tab=tasks"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Manage All
              </Link>
            </div>
            {projectTasks.length === 0 ? (
              <p className="text-xs text-slate-500">
                No tasks linked to this project yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {projectTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Assigned to {task.assignedToName} • {task.priority}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">
              Project Members
            </h3>
            <div className="space-y-2.5">
              {project.members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {m.role}
                    </span>
                    {isOwner && m.role !== "owner" && (
                      <button
                        type="button"
                        disabled={memberLoading}
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
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

          <div className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              Invite Collaborator
            </h3>
            <p className="text-xs text-slate-400">
              Add teammates or freelance partners who already have a GiRe account by email so you can collaborate and delegate tasks in Phase 3.
            </p>
            {memberError && (
              <p className="text-xs text-rose-400">{memberError}</p>
            )}
            <form onSubmit={handleInviteMember} className="flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="flex-1 px-3 py-2 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs text-slate-100"
              />
              <Button type="submit" disabled={memberLoading}>
                {memberLoading ? "Adding..." : "Invite"}
              </Button>
            </form>
          </div>
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
              <p className="text-xs text-rose-400">{editError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ProjectCategory)
                  }
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
                >
                  <option value="office">Office</option>
                  <option value="freelance">Freelance</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Client / Team
                </label>
                <input
                  type="text"
                  value={clientOrTeam}
                  onChange={(e) => setClientOrTeam(e.target.value)}
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">
                Linked Repositories
              </label>
              {availableRepos.length > 0 && (
                <div className="max-h-32 overflow-y-auto bg-[#0b0f19] border border-slate-800 rounded-lg p-2 space-y-1">
                  {availableRepos.map((repo) => (
                    <label
                      key={repo}
                      className="flex items-center gap-2 text-xs text-slate-300 px-1.5 py-1 hover:bg-slate-800/60 rounded cursor-pointer"
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
                  className="flex-1 px-3 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
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
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
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

