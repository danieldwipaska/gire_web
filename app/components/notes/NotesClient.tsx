"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  FileText,
  FolderKanban,
  ListTodo,
  Pin,
  PinOff,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  INote,
  INoteUser,
  IProject,
  ITask,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import { getTimeAgo } from "@/lib/utils";
import Button from "../buttons/Button";
import Modal from "../modals/Modal";
import RichNoteEditor from "./RichNoteEditor";

const STATUS_META: Record<
  TaskStatus,
  { label: string; badgeClass: string }
> = {
  todo: {
    label: "To Do",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-sky-950/60 text-sky-300 border-sky-700/50",
  },
  in_review: {
    label: "In Review",
    badgeClass: "bg-amber-950/60 text-amber-300 border-amber-700/50",
  },
  done: {
    label: "Done",
    badgeClass: "bg-emerald-950/60 text-emerald-300 border-emerald-700/50",
  },
};

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; badgeClass: string }
> = {
  low: {
    label: "Low",
    badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-indigo-950/60 text-indigo-300 border-indigo-700/50",
  },
  high: {
    label: "High",
    badgeClass: "bg-amber-950/60 text-amber-300 border-amber-700/50",
  },
  urgent: {
    label: "Urgent",
    badgeClass: "bg-rose-950/60 text-rose-300 border-rose-700/50",
  },
};

export default function NotesClient({
  currentUserId,
  isSuperUser = false,
  initialNotes,
  initialTasks,
  projects,
  users,
  initialTab = "notes",
  initialNoteId,
  initialProjectId,
}: {
  currentUserId: string;
  isSuperUser?: boolean;
  initialNotes: INote[];
  initialTasks: ITask[];
  projects: IProject[];
  users: INoteUser[];
  initialTab?: "notes" | "tasks";
  initialNoteId?: string;
  initialProjectId?: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<INote[]>(initialNotes);
  const [tasks, setTasks] = useState<ITask[]>(initialTasks);
  const [mainTab, setMainTab] = useState<"notes" | "tasks">(initialTab);

  // Notes sidebar filters
  const [noteSearch, setNoteSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>(
    initialProjectId || "all",
  );
  const [activeNoteId, setActiveNoteId] = useState<string>(
    initialNoteId && initialNotes.some((n) => n._id === initialNoteId)
      ? initialNoteId
      : initialNotes[0]?._id || "",
  );

  // Active note editor fields
  const activeNote = useMemo(
    () => notes.find((n) => n._id === activeNoteId) || null,
    [notes, activeNoteId],
  );
  const [draftTitle, setDraftTitle] = useState(activeNote?.title || "");
  const [draftContent, setDraftContent] = useState(activeNote?.content || "");
  const [draftProjectId, setDraftProjectId] = useState(
    activeNote?.projectId || "",
  );
  const [draftTagsText, setDraftTagsText] = useState(
    (activeNote?.tags || []).join(", "),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Share modal
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareError, setShareError] = useState("");

  // Delegate / New Task modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState(currentUserId);
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskSourceNoteId, setTaskSourceNoteId] = useState<string | null>(null);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState("");

  // Delegated Tasks view filters
  const [taskScope, setTaskScope] = useState<
    "assigned_to_me" | "delegated_by_me" | "all"
  >("assigned_to_me");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | TaskStatus>(
    "all",
  );

  // Sync draft state when switching notes
  useEffect(() => {
    if (!activeNote) {
      setDraftTitle("");
      setDraftContent("");
      setDraftProjectId("");
      setDraftTagsText("");
      return;
    }
    setDraftTitle(activeNote.title);
    setDraftContent(activeNote.content);
    setDraftProjectId(activeNote.projectId || "");
    setDraftTagsText((activeNote.tags || []).join(", "));
    setSaveState("idle");
  }, [activeNote?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    return notes.filter((n) => {
      if (projectFilter === "standalone" && n.projectId) return false;
      if (
        projectFilter !== "all" &&
        projectFilter !== "standalone" &&
        n.projectId !== projectFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${n.title} ${(n.tags || []).join(" ")} ${n.projectName || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notes, noteSearch, projectFilter]);

  const noteTasks = useMemo(() => {
    if (!activeNote) return [];
    return tasks.filter((t) => t.sourceNoteId === activeNote._id);
  }, [tasks, activeNote]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskScope === "assigned_to_me" && t.assignedTo !== currentUserId) {
        return false;
      }
      if (taskScope === "delegated_by_me") {
        if (t.createdBy !== currentUserId || t.assignedTo === currentUserId) {
          return false;
        }
      }
      if (taskStatusFilter !== "all" && t.status !== taskStatusFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, taskScope, taskStatusFilter, currentUserId]);

  const saveNote = async (
    noteId: string,
    payload: {
      title?: string;
      content?: string;
      projectId?: string | null;
      tags?: string[];
      isPinned?: boolean;
    },
  ) => {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const updated = await res.json();
      const projectName = updated.projectId
        ? projects.find((p) => p._id === updated.projectId)?.name || null
        : null;
      setNotes((prev) =>
        prev.map((n) =>
          n._id === noteId ? { ...n, ...updated, projectName } : n,
        ),
      );
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  };

  const scheduleAutoSave = (
    noteId: string,
    nextTitle: string,
    nextContent: string,
    nextProjectId: string,
    nextTagsText: string,
  ) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveState("idle");
    autoSaveTimerRef.current = setTimeout(() => {
      const tags = nextTagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      void saveNote(noteId, {
        title: nextTitle,
        content: nextContent,
        projectId: nextProjectId || null,
        tags,
      });
    }, 800);
  };

  const handleCreateNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled Note",
        content: "",
        projectId:
          projectFilter !== "all" && projectFilter !== "standalone"
            ? projectFilter
            : null,
      }),
    });
    if (!res.ok) return;
    const created = await res.json();
    const projectName = created.projectId
      ? projects.find((p) => p._id === created.projectId)?.name || null
      : null;
    const hydrated: INote = {
      ...created,
      authorName:
        users.find((u) => u._id === currentUserId)?.name || "You",
      projectName,
    };
    setNotes((prev) => [hydrated, ...prev]);
    setActiveNoteId(hydrated._id);
    setMainTab("notes");
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    if (res.ok) {
      const remaining = notes.filter((n) => n._id !== noteId);
      setNotes(remaining);
      setActiveNoteId(remaining[0]?._id || "");
    }
  };

  const handleShareNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !shareEmail.trim()) return;
    setShareError("");
    const res = await fetch(`/api/notes/${activeNote._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareWithEmail: shareEmail.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setShareError(data.error || "Failed to share note");
      return;
    }
    setNotes((prev) =>
      prev.map((n) =>
        n._id === activeNote._id ? { ...n, sharedWith: data.sharedWith } : n,
      ),
    );
    setShareEmail("");
    setShareOpen(false);
  };

  const openDelegateModal = (prefillTitle = "", fromNote?: INote | null) => {
    setTaskTitle(prefillTitle);
    setTaskDesc("");
    setTaskAssigneeId(currentUserId);
    setTaskProjectId(fromNote?.projectId || "");
    setTaskSourceNoteId(fromNote?._id || null);
    setTaskPriority("medium");
    setTaskDueDate("");
    setTaskError("");
    setTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskSubmitting(true);
    setTaskError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assignedTo: taskAssigneeId,
          projectId: taskProjectId || null,
          sourceNoteId: taskSourceNoteId,
          priority: taskPriority,
          dueDate: taskDueDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delegate task");
      }

      const assignee = users.find((u) => u._id === data.assignedTo);
      const creator = users.find((u) => u._id === data.createdBy);
      const projectName = data.projectId
        ? projects.find((p) => p._id === data.projectId)?.name || null
        : null;
      const sourceNoteTitle = data.sourceNoteId
        ? notes.find((n) => n._id === data.sourceNoteId)?.title || null
        : null;

      const hydratedTask: ITask = {
        ...data,
        createdByName: creator?.name || "You",
        assignedToName: assignee?.name || "Unknown",
        assignedToEmail: assignee?.email || "",
        projectName,
        sourceNoteTitle,
      };
      setTasks((prev) => [hydratedTask, ...prev]);
      setTaskModalOpen(false);
      router.refresh();
    } catch (err) {
      setTaskError(
        err instanceof Error ? err.message : "Failed to create task",
      );
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status } : t)),
    );
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this delegated task?")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    }
  };

  const assignedToMeCount = tasks.filter(
    (t) => t.assignedTo === currentUserId && t.status !== "done",
  ).length;

  return (
    <div className="min-h-screen container space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">
            Notes & Task Delegation
          </h2>
          <p className="text-sm text-slate-400">
            Rich technical notes with images & code blocks, plus direct task delegation across GiRe users
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#131924] p-1 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMainTab("notes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === "notes"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Notes ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setMainTab("tasks")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === "tasks"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Delegated Tasks ({assignedToMeCount})
            </button>
          </div>

          {mainTab === "notes" ? (
            <Button onClick={handleCreateNote}>
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          ) : isSuperUser ? (
            <Button onClick={() => openDelegateModal("", null)}>
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          ) : null}
        </div>
      </div>

      {mainTab === "notes" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Notes Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 bg-[#131924] border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500"
              />
            </div>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs text-slate-300"
            >
              <option value="all">All Notes</option>
              <option value="standalone">Standalone (No Project)</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  Project: {p.name}
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs text-slate-500">No notes found.</p>
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    + Create your first note
                  </button>
                </div>
              ) : (
                filteredNotes.map((n) => {
                  const isActive = n._id === activeNoteId;
                  return (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => setActiveNoteId(n._id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        isActive
                          ? "bg-indigo-950/50 border-indigo-500/50"
                          : "bg-[#0b0f19] border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {n.title || "Untitled Note"}
                        </span>
                        {n.isPinned && (
                          <Pin className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="truncate">
                          {n.projectName || "Personal"}
                        </span>
                        <span className="shrink-0" suppressHydrationWarning>
                          {n.updatedAt ? getTimeAgo(n.updatedAt) : ""}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Note Editor Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            {!activeNote ? (
              <div className="bg-[#131924] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <FileText className="w-8 h-8 text-indigo-400/70 mx-auto" />
                <p className="text-base font-semibold text-slate-200">
                  Create a Notion-style Note
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Write specs with headings, checklists, tables, syntax-highlighted code blocks, paste screenshots directly, and delegate tasks to teammates.
                </p>
                <div className="flex justify-center pt-2">
                  <Button onClick={handleCreateNote}>
                    <Plus className="w-4 h-4" />
                    New Note
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  {/* Note Meta Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraftTitle(val);
                        scheduleAutoSave(
                          activeNote._id,
                          val,
                          draftContent,
                          draftProjectId,
                          draftTagsText,
                        );
                      }}
                      placeholder="Note title..."
                      className="flex-1 bg-transparent text-xl font-bold text-slate-100 focus:outline-none border-b border-transparent focus:border-indigo-500 pb-1"
                    />

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 px-2">
                        {saveState === "saving"
                          ? "Saving..."
                          : saveState === "saved"
                            ? "Saved"
                            : ""}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          const tags = draftTagsText
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);
                          void saveNote(activeNote._id, {
                            title: draftTitle,
                            content: draftContent,
                            projectId: draftProjectId || null,
                            tags,
                          });
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                        title="Save Note"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void saveNote(activeNote._id, {
                            isPinned: !activeNote.isPinned,
                          })
                        }
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          activeNote.isPinned
                            ? "bg-amber-950/50 border-amber-700/50 text-amber-300"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                        title={activeNote.isPinned ? "Unpin Note" : "Pin Note"}
                      >
                        {activeNote.isPinned ? (
                          <PinOff className="w-3.5 h-3.5" />
                        ) : (
                          <Pin className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShareError("");
                          setShareOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>

                      {activeNote.userId === currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(activeNote._id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Project & Tags Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={draftProjectId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftProjectId(val);
                          scheduleAutoSave(
                            activeNote._id,
                            draftTitle,
                            draftContent,
                            val,
                            draftTagsText,
                          );
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs text-slate-200"
                      >
                        <option value="">No Project (Standalone)</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={draftTagsText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraftTagsText(val);
                        scheduleAutoSave(
                          activeNote._id,
                          draftTitle,
                          draftContent,
                          draftProjectId,
                          val,
                        );
                      }}
                      placeholder="Tags (comma separated, e.g. api, spec, bug)"
                      className="px-2.5 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500"
                    />
                  </div>

                  {/* Rich Editor */}
                  <RichNoteEditor
                    noteId={activeNote._id}
                    initialContent={activeNote.content}
                    onChange={(html) => {
                      setDraftContent(html);
                      scheduleAutoSave(
                        activeNote._id,
                        draftTitle,
                        html,
                        draftProjectId,
                        draftTagsText,
                      );
                    }}
                    onDelegateSelection={
                      isSuperUser
                        ? (selected) => openDelegateModal(selected, activeNote)
                        : undefined
                    }
                  />
                </div>

                {/* Delegated Tasks Linked to This Note */}
                <div className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-indigo-400" />
                      Delegated Tasks from this Note ({noteTasks.length})
                    </h3>
                    {isSuperUser && (
                      <Button
                        onClick={() => openDelegateModal("", activeNote)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Delegate Task
                      </Button>
                    )}
                  </div>

                  {noteTasks.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      {isSuperUser
                        ? 'Highlight text in the editor above and click "Delegate Selection as Task", or click "Delegate Task" to assign action items to users in this Workspace.'
                        : "No tasks delegated from this note yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {noteTasks.map((t) => (
                        <div
                          key={t._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-semibold text-slate-100 truncate">
                              {t.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1 text-indigo-300 font-medium">
                                <UserCheck className="w-3 h-3" />
                                Assigned to {t.assignedToName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                                  PRIORITY_META[t.priority].badgeClass
                                }`}
                              >
                                {PRIORITY_META[t.priority].label}
                              </span>
                              {t.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(t.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={t.status}
                              onChange={(e) =>
                                handleUpdateTaskStatus(
                                  t._id,
                                  e.target.value as TaskStatus,
                                )
                              }
                              className="px-2.5 py-1 bg-[#131924] border border-slate-700 rounded-lg text-xs text-slate-200"
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">In Review</option>
                              <option value="done">Done</option>
                            </select>
                            {isSuperUser && t.createdBy === currentUserId && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t._id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Delegated Tasks View */
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131924] border border-slate-800/80 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-1 bg-[#0b0f19] p-1 border border-slate-800 rounded-xl w-fit">
              {(isSuperUser
                ? ([
                    { value: "assigned_to_me", label: "Assigned to Me" },
                    { value: "delegated_by_me", label: "Delegated by Me" },
                    { value: "all", label: "All My Tasks" },
                  ] as const)
                : ([
                    { value: "assigned_to_me", label: "Assigned to Me" },
                  ] as const)
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setTaskScope(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    taskScope === tab.value
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { value: "all", label: "All Status" },
                  { value: "todo", label: "To Do" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "in_review", label: "In Review" },
                  { value: "done", label: "Done" },
                ] as const
              ).map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setTaskStatusFilter(st.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer ${
                    taskStatusFilter === st.value
                      ? "bg-indigo-950/60 text-indigo-300 border-indigo-600/50"
                      : "bg-[#0b0f19] text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-[#131924] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/70 mx-auto" />
              <p className="text-sm font-semibold text-slate-200">
                No tasks in this view
              </p>
              <p className="text-xs text-slate-500">
                Create a task or delegate items directly from any Note.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-slate-100">
                        {task.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 ${
                          PRIORITY_META[task.priority].badgeClass
                        }`}
                      >
                        {PRIORITY_META[task.priority].label}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
                      <span className="px-2 py-0.5 rounded bg-[#0b0f19] border border-slate-800 text-slate-300">
                        From <strong>{task.createdByName}</strong> →{" "}
                        <strong className="text-indigo-300">
                          {task.assignedToName}
                        </strong>
                      </span>
                      {task.projectName && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {task.projectName}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      {task.sourceNoteId && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNoteId(task.sourceNoteId!);
                            setMainTab("notes");
                          }}
                          className="px-2.5 py-1 bg-[#0b0f19] hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-semibold text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          {task.sourceNoteTitle || "Open Source Note"}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleUpdateTaskStatus(
                            task._id,
                            e.target.value as TaskStatus,
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          STATUS_META[task.status].badgeClass
                        }`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                      {isSuperUser && task.createdBy === currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Note Modal */}
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Note with GiRe User"
        body={
          <form onSubmit={handleShareNote} className="space-y-4 min-w-[320px]">
            {shareError && (
              <p className="text-xs text-rose-400">{shareError}</p>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                User Email
              </label>
              <input
                type="email"
                required
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <Button type="submit">Share Note</Button>
            </div>
          </form>
        }
      />

      {/* Delegate Task Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={taskSourceNoteId ? "Delegate Task from Note" : "Create Task"}
        body={
          <form
            onSubmit={handleCreateTask}
            className="flex flex-col gap-4 w-full max-w-md min-w-[340px]"
          >
            {taskError && (
              <p className="text-xs text-rose-400">{taskError}</p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Implement webhook signature check"
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Instructions / Context
              </label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Additional notes for the assignee..."
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Delegate To (User) *
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
                >
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value as TaskPriority)
                  }
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Project
                </label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="">No Project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                disabled={taskSubmitting}
              >
                Cancel
              </button>
              <Button type="submit" disabled={taskSubmitting}>
                {taskSubmitting ? "Delegating..." : "Delegate Task"}
              </Button>
            </div>
          </form>
        }
      />
    </div>
  );
}

