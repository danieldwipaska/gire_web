"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CircleDot,
  Figma,
  FolderGit2,
  FolderKanban,
  GitPullRequest,
  Laptop,
  Plus,
  Search,
  User,
} from "lucide-react";
import { IProject, ProjectCategory } from "@/lib/types";
import Button from "../buttons/Button";
import SummaryCard from "../cards/SummaryCard";
import Modal from "../modals/Modal";

const CATEGORY_META: Record<
  ProjectCategory,
  { label: string; badgeClass: string; icon: typeof Briefcase }
> = {
  office: {
    label: "Office",
    badgeClass: "bg-indigo-950/60 text-indigo-300 border-indigo-700/50",
    icon: Briefcase,
  },
  freelance: {
    label: "Freelance",
    badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-700/50",
    icon: Laptop,
  },
  personal: {
    label: "Personal",
    badgeClass: "bg-sky-950/60 text-sky-300 border-sky-700/50",
    icon: User,
  },
};

export default function ProjectsClient({
  projects,
  availableRepos,
}: {
  projects: IProject[];
  availableRepos: string[];
}) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<"all" | ProjectCategory>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("office");
  const [clientOrTeam, setClientOrTeam] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [customRepo, setCustomRepo] = useState("");
  const [figmaTitle, setFigmaTitle] = useState("");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaKind, setFigmaKind] = useState<"design" | "prototype">("design");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.clientOrTeam || ""} ${p.description || ""} ${(p.repos || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, categoryFilter, search]);

  const counts = useMemo(() => {
    return {
      total: projects.length,
      office: projects.filter((p) => p.category === "office").length,
      freelance: projects.filter((p) => p.category === "freelance").length,
      repos: new Set(projects.flatMap((p) => p.repos || [])).size,
    };
  }, [projects]);

  const toggleRepo = (repo: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repo) ? prev.filter((r) => r !== repo) : [...prev, repo],
    );
  };

  const handleAddCustomRepo = () => {
    const trimmed = customRepo.trim();
    if (!trimmed || !trimmed.includes("/")) return;
    if (!selectedRepos.includes(trimmed)) {
      setSelectedRepos((prev) => [...prev, trimmed]);
    }
    setCustomRepo("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const figmaLinks = figmaUrl.trim()
        ? [
            {
              title:
                figmaTitle.trim() ||
                (figmaKind === "prototype" ? "Prototype" : "Design"),
              url: figmaUrl.trim(),
              kind: figmaKind,
            },
          ]
        : [];

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          clientOrTeam,
          description,
          repos: selectedRepos,
          figmaLinks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setModalOpen(false);
      setName("");
      setCategory("office");
      setClientOrTeam("");
      setDescription("");
      setSelectedRepos([]);
      setFigmaTitle("");
      setFigmaUrl("");
      router.refresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create project",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen container">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">Projects</h2>
          <p className="text-sm text-slate-400">
            Organize your office & freelance repos, Figma designs, and team members
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <SummaryCard
          title="Total Projects"
          desc="Active workspaces"
          value={counts.total}
          icon={
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
            </div>
          }
        />
        <SummaryCard
          title="Office"
          desc="Company / team projects"
          value={counts.office}
          icon={
            <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-sky-400" />
            </div>
          }
        />
        <SummaryCard
          title="Freelance"
          desc="Client engagements"
          value={counts.freelance}
          icon={
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
              <Laptop className="w-4 h-4 text-emerald-400" />
            </div>
          }
        />
        <SummaryCard
          title="Linked Repos"
          desc="Mapped GitHub repositories"
          value={counts.repos}
          icon={
            <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
              <FolderGit2 className="w-4 h-4 text-amber-400" />
            </div>
          }
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 bg-[#131924] p-1 border border-slate-800 rounded-xl w-fit">
          {(
            [
              { value: "all", label: "All" },
              { value: "office", label: "Office" },
              { value: "freelance", label: "Freelance" },
              { value: "personal", label: "Personal" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategoryFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === tab.value
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, clients, or repos..."
            className="w-full pl-8 pr-3 py-2 bg-[#131924] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-[#131924] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FolderKanban className="w-8 h-8 text-indigo-400/70 mx-auto" />
          <p className="text-base font-semibold text-slate-200">
            No projects yet
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create your first Office or Freelance project to group your GitHub repositories, attach Figma design previews, and filter your Dashboard & Analytics.
          </p>
          <div className="pt-2 flex justify-center">
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const catMeta = CATEGORY_META[project.category] || CATEGORY_META.office;
            const CatIcon = catMeta.icon;
            return (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/40 hover:bg-[#172030] transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                        {project.name}
                      </h3>
                      {project.clientOrTeam && (
                        <p className="text-xs text-slate-400 truncate">
                          {project.clientOrTeam}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border flex items-center gap-1 shrink-0 ${catMeta.badgeClass}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      {catMeta.label}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {project.repos && project.repos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.repos.slice(0, 3).map((repo) => (
                        <span
                          key={repo}
                          className="px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 text-[11px] font-mono text-slate-300"
                        >
                          {repo}
                        </span>
                      ))}
                      {project.repos.length > 3 && (
                        <span className="px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 text-[11px] text-slate-400">
                          +{project.repos.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
                      {project.stats?.openPRs ?? 0} PRs
                    </span>
                    <span className="flex items-center gap-1">
                      <CircleDot className="w-3.5 h-3.5 text-sky-400" />
                      {project.stats?.openIssues ?? 0} Issues
                    </span>
                  </div>
                  {project.figmaLinks && project.figmaLinks.length > 0 && (
                    <span className="flex items-center gap-1 text-pink-300 font-medium">
                      <Figma className="w-3.5 h-3.5" />
                      {project.figmaLinks.length}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Project"
        body={
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-4 w-full max-w-lg max-h-[75vh] overflow-y-auto pr-1"
          >
            {formError && (
              <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/50 rounded-lg p-2.5">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Core Payment API"
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

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Client / Team Name
              </label>
              <input
                type="text"
                value={clientOrTeam}
                onChange={(e) => setClientOrTeam(e.target.value)}
                placeholder="e.g. PT Acme / Squad Checkout"
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the project..."
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>

            {/* Repos Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">
                Linked GitHub Repositories
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
                        onChange={() => toggleRepo(repo)}
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
                  placeholder="Add repo manually (owner/repo)"
                  className="flex-1 px-3 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRepo}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
              {selectedRepos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedRepos.map((r) => (
                    <span
                      key={r}
                      onClick={() => toggleRepo(r)}
                      className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/50 text-[11px] font-mono text-indigo-300 cursor-pointer"
                      title="Click to remove"
                    >
                      {r} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Figma */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">
                Figma Design / Prototype Link (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={figmaTitle}
                  onChange={(e) => setFigmaTitle(e.target.value)}
                  placeholder="Label (e.g. App UI)"
                  className="px-3 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
                />
                <select
                  value={figmaKind}
                  onChange={(e) =>
                    setFigmaKind(e.target.value as "design" | "prototype")
                  }
                  className="px-3 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="design">Design Preview</option>
                  <option value="prototype">Interactive Prototype</option>
                </select>
              </div>
              <input
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/design/..."
                className="px-3 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                disabled={submitting}
              >
                Cancel
              </button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        }
      />
    </div>
  );
}

