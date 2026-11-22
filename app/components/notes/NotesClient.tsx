"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Cloud,
  FileText,
  FolderKanban,
  HardDrive,
  KeyRound,
  ListTodo,
  Lock,
  Pin,
  PinOff,
  Plus,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
} from "lucide-react";
import {
  INote,
  INoteUser,
  IProject,
  IStorageIntegration,
  ITask,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import {
  decryptNoteContent,
  encryptNoteContent,
  isE2eeEnvelope,
} from "@/lib/security/e2ee";
import { getTimeAgo } from "@/lib/utils";
import Button from "../buttons/Button";
import Modal from "../modals/Modal";
import RichNoteEditor from "./RichNoteEditor";
import StorageIntegrationsPanel from "./StorageIntegrationsPanel";

const STATUS_META: Record<
  TaskStatus,
  { label: string; badgeClass: string }
> = {
  todo: {
    label: "To Do",
    badgeClass: "bg-[#EEEEEE] text-[#1C1C1F] border-[#E2E2E2]",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-[#418CFF]/15 text-[#2563EB] border-[#418CFF]/30",
  },
  in_review: {
    label: "In Review",
    badgeClass: "bg-[#EA5DEE]/15 text-[#A21CAF] border-[#EA5DEE]/30",
  },
  done: {
    label: "Done",
    badgeClass: "bg-[#69D7D8]/25 text-[#0F766E] border-[#69D7D8]/50",
  },
};

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; badgeClass: string }
> = {
  low: {
    label: "Low",
    badgeClass: "bg-[#EEEEEE] text-[#6E6E77] border-[#E2E2E2]",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-[#5432EE]/12 text-[#5432EE] border-[#5432EE]/25",
  },
  high: {
    label: "High",
    badgeClass: "bg-[#EA5DEE]/15 text-[#A21CAF] border-[#EA5DEE]/30",
  },
  urgent: {
    label: "Urgent",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

export default function NotesClient({
  currentUserId,
  isSuperUser = false,
  initialNotes,
  initialTasks,
  initialStorageIntegrations = [],
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
  initialStorageIntegrations?: IStorageIntegration[];
  projects: IProject[];
  users: INoteUser[];
  initialTab?: "notes" | "tasks" | "integrations";
  initialNoteId?: string;
  initialProjectId?: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<INote[]>(initialNotes);
  const [tasks, setTasks] = useState<ITask[]>(initialTasks);
  const [storageIntegrations, setStorageIntegrations] = useState<
    IStorageIntegration[]
  >(initialStorageIntegrations);
  const [mainTab, setMainTab] = useState<"notes" | "tasks" | "integrations">(
    initialTab,
  );

  const [noteSearch, setNoteSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>(
    initialProjectId || "all",
  );
  const [activeNoteId, setActiveNoteId] = useState<string>(
    initialNoteId && initialNotes.some((n) => n._id === initialNoteId)
      ? initialNoteId
      : initialNotes[0]?._id || "",
  );

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

  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareError, setShareError] = useState("");

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

  const [taskScope, setTaskScope] = useState<
    "assigned_to_me" | "delegated_by_me" | "all"
  >("assigned_to_me");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | TaskStatus>(
    "all",
  );

  const [unlockedPlaintext, setUnlockedPlaintext] = useState<
    Record<string, string>
  >({});
  const activePassphrasesRef = useRef<Record<string, string>>({});
  const [unlockPassphrase, setUnlockPassphrase] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [encryptModalOpen, setEncryptModalOpen] = useState(false);
  const [encryptPassphrase, setEncryptPassphrase] = useState("");
  const [encryptConfirm, setEncryptConfirm] = useState("");
  const [encryptError, setEncryptError] = useState("");
  const [encryptSubmitting, setEncryptSubmitting] = useState(false);

  const isActiveNoteLocked = Boolean(
    activeNote?.isEncrypted && unlockedPlaintext[activeNote._id] === undefined,
  );

  useEffect(() => {
    setUnlockPassphrase("");
    setUnlockError("");
    if (!activeNote) {
      setDraftTitle("");
      setDraftContent("");
      setDraftProjectId("");
      setDraftTagsText("");
      return;
    }
    setDraftTitle(activeNote.title);
    if (activeNote.isEncrypted) {
      setDraftContent(unlockedPlaintext[activeNote._id] ?? "");
    } else {
      setDraftContent(activeNote.content);
    }
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
      isEncrypted?: boolean;
    },
  ) => {
    setSaveState("saving");
    try {
      const targetNote = notes.find((n) => n._id === noteId);
      const nextPayload = { ...payload };
      const effectiveEncrypted =
        typeof nextPayload.isEncrypted === "boolean"
          ? nextPayload.isEncrypted
          : Boolean(targetNote?.isEncrypted);

      if (typeof nextPayload.content === "string" && effectiveEncrypted) {
        if (!isE2eeEnvelope(nextPayload.content)) {
          const pass = activePassphrasesRef.current[noteId];
          if (!pass) {
            delete nextPayload.content;
          } else {
            const plain = nextPayload.content;
            nextPayload.content = await encryptNoteContent(plain, pass);
            setUnlockedPlaintext((prev) => ({ ...prev, [noteId]: plain }));
          }
        }
      }

      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextPayload),
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

  const handleUnlockNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !unlockPassphrase) return;
    setUnlocking(true);
    setUnlockError("");
    try {
      const plaintext = activeNote.content
        ? await decryptNoteContent(activeNote.content, unlockPassphrase)
        : "";
      activePassphrasesRef.current[activeNote._id] = unlockPassphrase;
      setUnlockedPlaintext((prev) => ({
        ...prev,
        [activeNote._id]: plaintext,
      }));
      setDraftContent(plaintext);
      setUnlockPassphrase("");
    } catch (err) {
      setUnlockError(
        err instanceof Error ? err.message : "Incorrect passphrase",
      );
    } finally {
      setUnlocking(false);
    }
  };

  const handleLockNote = (noteId: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    delete activePassphrasesRef.current[noteId];
    setUnlockedPlaintext((prev) => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
    if (activeNoteId === noteId) {
      setDraftContent("");
      setUnlockPassphrase("");
      setUnlockError("");
    }
  };

  const handleEnableE2ee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote) return;
    if (encryptPassphrase.length < 6) {
      setEncryptError("Passphrase must be at least 6 characters.");
      return;
    }
    if (encryptPassphrase !== encryptConfirm) {
      setEncryptError("Passphrases do not match.");
      return;
    }

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setEncryptSubmitting(true);
    setEncryptError("");
    try {
      const currentPlain = draftContent;
      const ciphertext = await encryptNoteContent(
        currentPlain,
        encryptPassphrase,
      );
      activePassphrasesRef.current[activeNote._id] = encryptPassphrase;
      await saveNote(activeNote._id, {
        isEncrypted: true,
        content: ciphertext,
      });
      setUnlockedPlaintext((prev) => ({
        ...prev,
        [activeNote._id]: currentPlain,
      }));
      setEncryptPassphrase("");
      setEncryptConfirm("");
      setEncryptModalOpen(false);
    } catch (err) {
      setEncryptError(
        err instanceof Error ? err.message : "Failed to encrypt note",
      );
    } finally {
      setEncryptSubmitting(false);
    }
  };

  const handleDisableE2ee = async (noteId: string) => {
    if (
      !confirm(
        "Remove End-to-End Encryption and store this note normally on the server?",
      )
    ) {
      return;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const plain = unlockedPlaintext[noteId] ?? draftContent;
    await saveNote(noteId, {
      isEncrypted: false,
      content: plain,
    });
    delete activePassphrasesRef.current[noteId];
    setUnlockedPlaintext((prev) => {
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
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
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center animate-fade-up">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#1C1C1F] tracking-tight">
            Notes &amp; Task Delegation
          </h2>
          <p className="text-sm text-[#6E6E77]">
            Rich technical notes with images &amp; code blocks, plus direct task delegation across GiRe users
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#EEEEEE] p-1 border border-[#E2E2E2] rounded-full">
            <button
              type="button"
              onClick={() => setMainTab("notes")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === "notes"
                  ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-xs"
                  : "text-[#6E6E77] hover:text-[#1C1C1F]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Notes ({notes.length})
            </button>
            <button
              type="button"
              onClick={() => setMainTab("tasks")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === "tasks"
                  ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-xs"
                  : "text-[#6E6E77] hover:text-[#1C1C1F]"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Delegated Tasks ({assignedToMeCount})
            </button>
            <button
              type="button"
              onClick={() => setMainTab("integrations")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === "integrations"
                  ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-xs"
                  : "text-[#6E6E77] hover:text-[#1C1C1F]"
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              Integrations
              {storageIntegrations.some((s) => s.isActive) && (
                <span className="w-2 h-2 rounded-full bg-[#69D7D8]" />
              )}
            </button>
          </div>

          {mainTab === "notes" ? (
            <Button onClick={handleCreateNote}>
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          ) : mainTab === "tasks" && isSuperUser ? (
            <Button onClick={() => openDelegateModal("", null)}>
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          ) : null}
        </div>
      </div>

      {mainTab === "notes" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-up-delay-1">
          {/* Notes Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-4 space-y-3 shadow-[0_2px_12px_rgba(28,28,31,0.03)]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8A8A93] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-full text-xs text-[#1C1C1F] placeholder-[#8A8A93] focus:outline-none focus:bg-white focus:border-[#5432EE]"
              />
            </div>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-full text-xs font-medium text-[#1C1C1F]"
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
                  <p className="text-xs text-[#6E6E77]">No notes found.</p>
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="text-xs text-[#5432EE] hover:text-[#418CFF] font-semibold cursor-pointer"
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
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                        isActive
                          ? "bg-[#1C1C1F] text-white border-[#1C1C1F] shadow-sm"
                          : "bg-[#F9F9F9] border-[#E2E2E2] hover:bg-[#FFFFFF] hover:border-[#5432EE]/40 text-[#1C1C1F]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">
                          {n.title || "Untitled Note"}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {n.isEncrypted && (
                            <span title="End-to-End Encrypted">
                              <Lock className={`w-3 h-3 ${isActive ? "text-[#69D7D8]" : "text-[#0F766E]"}`} />
                            </span>
                          )}
                          {n.isPinned && (
                            <Pin className={`w-3 h-3 ${isActive ? "text-[#EA5DEE]" : "text-[#A21CAF]"}`} />
                          )}
                        </div>
                      </div>
                      <div className={`flex items-center justify-between gap-2 text-[11px] ${isActive ? "text-white/70" : "text-[#6E6E77]"}`}>
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
              <div className="bg-[#FFFFFF] border border-dashed border-[#D2D2DA] rounded-3xl p-12 text-center space-y-3">
                <FileText className="w-8 h-8 text-[#5432EE] mx-auto" />
                <p className="text-base font-bold text-[#1C1C1F]">
                  Create a Notion-style Note
                </p>
                <p className="text-xs text-[#6E6E77] max-w-md mx-auto">
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
                <div className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.03)]">
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
                      className="flex-1 bg-transparent text-xl font-bold text-[#1C1C1F] focus:outline-none border-b border-transparent focus:border-[#5432EE] pb-1"
                    />

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium text-[#6E6E77] px-2">
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
                        className="px-3.5 py-1.5 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] flex items-center gap-1 cursor-pointer"
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
                        className={`p-1.5 rounded-full border cursor-pointer ${
                          activeNote.isPinned
                            ? "bg-[#EA5DEE]/15 border-[#EA5DEE]/30 text-[#A21CAF]"
                            : "bg-[#F4F4F6] border-[#E2E2E2] text-[#6E6E77] hover:text-[#1C1C1F]"
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
                        onClick={() => setMainTab("integrations")}
                        className="px-3 py-1.5 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-[11px] font-semibold text-[#1C1C1F] flex items-center gap-1.5 cursor-pointer"
                        title="Configure image storage (Cloudflare R2, GCP, or Local Server)"
                      >
                        <Cloud className="w-3 h-3 text-[#418CFF]" />
                        {(() => {
                          const active = storageIntegrations.find(
                            (s) => s.isActive,
                          );
                          if (active?.provider === "cloudflare_r2")
                            return "R2 Storage";
                          if (active?.provider === "gcp_gcs")
                            return "GCP Storage";
                          return "Server Storage";
                        })()}
                      </button>

                      {activeNote.userId === currentUserId &&
                        (activeNote.isEncrypted ? (
                          isActiveNoteLocked ? (
                            <span className="px-3 py-1.5 bg-[#69D7D8]/25 border border-[#69D7D8]/50 rounded-full text-[11px] font-semibold text-[#0F766E] flex items-center gap-1.5">
                              <Lock className="w-3 h-3" />
                              E2EE Locked
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleLockNote(activeNote._id)}
                                className="px-3 py-1.5 bg-[#69D7D8]/25 hover:bg-[#69D7D8]/40 border border-[#69D7D8]/50 rounded-full text-xs font-semibold text-[#0F766E] flex items-center gap-1 cursor-pointer"
                                title="Clear decrypted note from memory and lock it"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Lock
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDisableE2ee(activeNote._id)
                                }
                                className="px-3 py-1.5 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] flex items-center gap-1 cursor-pointer"
                                title="Remove E2EE and store unencrypted"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                Decrypt
                              </button>
                            </>
                          )
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEncryptPassphrase("");
                                setEncryptConfirm("");
                                setEncryptError("");
                                setEncryptModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-[#69D7D8]/25 hover:bg-[#69D7D8]/40 border border-[#69D7D8]/50 rounded-full text-xs font-semibold text-[#0F766E] flex items-center gap-1 cursor-pointer"
                              title="Encrypt this note end-to-end in your browser"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Encrypt (E2EE)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShareError("");
                                setShareOpen(true);
                              }}
                              className="px-3 py-1.5 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Share
                            </button>
                          </>
                        ))}

                      {activeNote.userId === currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(activeNote._id)}
                          className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 cursor-pointer"
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
                      <FolderKanban className="w-3.5 h-3.5 text-[#6E6E77] shrink-0" />
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
                        className="w-full px-3 py-1.5 bg-[#F4F4F6] border border-[#E2E2E2] rounded-full text-xs font-medium text-[#1C1C1F]"
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
                      className="px-3.5 py-1.5 bg-[#F4F4F6] border border-[#E2E2E2] rounded-full text-xs text-[#1C1C1F] placeholder-[#8A8A93]"
                    />
                  </div>

                  {/* Rich Editor or Locked E2EE Vault */}
                  {isActiveNoteLocked ? (
                    <div className="min-h-[360px] bg-[#F9F9F9] border border-[#69D7D8]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#69D7D8]/25 border border-[#69D7D8]/50 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-[#0F766E]" />
                      </div>
                      <div className="space-y-1 max-w-md">
                        <h4 className="text-base font-bold text-[#1C1C1F]">
                          End-to-End Encrypted Note
                        </h4>
                        <p className="text-xs text-[#6E6E77]">
                          Protected in your browser with PBKDF2 + AES-256-GCM.
                          Neither the server nor the database can read this
                          note.
                        </p>
                      </div>

                      <form
                        onSubmit={handleUnlockNote}
                        className="w-full max-w-sm space-y-3"
                      >
                        {unlockError && (
                          <p className="text-xs text-rose-600 font-medium">{unlockError}</p>
                        )}
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-[#8A8A93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            value={unlockPassphrase}
                            onChange={(e) => {
                              setUnlockPassphrase(e.target.value);
                              setUnlockError("");
                            }}
                            placeholder="Enter encryption passphrase..."
                            className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFFFFF] border border-[#E2E2E2] rounded-full text-sm text-[#1C1C1F] placeholder-[#8A8A93] focus:outline-none focus:border-[#0F766E]"
                          />
                        </div>
                        <Button type="submit" disabled={unlocking} className="w-full">
                          <Unlock className="w-4 h-4" />
                          {unlocking ? "Decrypting..." : "Unlock Note"}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <RichNoteEditor
                      key={`${activeNote._id}-${activeNote.isEncrypted ? "e2ee" : "plain"}`}
                      noteId={activeNote._id}
                      initialContent={
                        activeNote.isEncrypted
                          ? unlockedPlaintext[activeNote._id] ?? ""
                          : activeNote.content
                      }
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
                        isSuperUser && !activeNote.isEncrypted
                          ? (selected) => openDelegateModal(selected, activeNote)
                          : undefined
                      }
                    />
                  )}
                </div>

                {/* Delegated Tasks Linked to This Note */}
                <div className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-5 space-y-3 shadow-[0_2px_12px_rgba(28,28,31,0.03)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1C1C1F] flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-[#5432EE]" />
                      Delegated Tasks from this Note ({noteTasks.length})
                    </h3>
                    {isSuperUser && !activeNote.isEncrypted && (
                      <Button
                        onClick={() => openDelegateModal("", activeNote)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Delegate Task
                      </Button>
                    )}
                  </div>

                  {activeNote.isEncrypted ? (
                    <p className="text-xs text-[#0F766E] font-medium">
                      End-to-End Encrypted notes are private to your account and
                      cannot be shared or delegated to other users.
                    </p>
                  ) : noteTasks.length === 0 ? (
                    <p className="text-xs text-[#6E6E77]">
                      {isSuperUser
                        ? 'Highlight text in the editor above and click "Delegate Selection as Task", or click "Delegate Task" to assign action items to users in this Workspace.'
                        : "No tasks delegated from this note yet."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {noteTasks.map((t) => (
                        <div
                          key={t._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl px-4 py-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-bold text-[#1C1C1F] truncate">
                              {t.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6E6E77]">
                              <span className="flex items-center gap-1 text-[#5432EE] font-semibold">
                                <UserCheck className="w-3 h-3" />
                                Assigned to {t.assignedToName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
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
                              className="px-3 py-1 bg-[#FFFFFF] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F]"
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
                                className="p-1.5 text-[#8A8A93] hover:text-rose-600 cursor-pointer"
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
      ) : mainTab === "integrations" ? (
        <StorageIntegrationsPanel
          integrations={storageIntegrations}
          onChange={setStorageIntegrations}
        />
      ) : (
        /* Delegated Tasks View */
        <div className="space-y-5 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-4 shadow-[0_2px_12px_rgba(28,28,31,0.03)]">
            <div className="flex flex-wrap items-center gap-1 bg-[#EEEEEE] p-1 border border-[#E2E2E2] rounded-full w-fit">
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    taskScope === tab.value
                      ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-xs"
                      : "text-[#6E6E77] hover:text-[#1C1C1F]"
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                    taskStatusFilter === st.value
                      ? "bg-[#1C1C1F] text-white border-[#1C1C1F]"
                      : "bg-[#F9F9F9] text-[#6E6E77] border-[#E2E2E2] hover:text-[#1C1C1F]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-dashed border-[#D2D2DA] rounded-3xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#0F766E] mx-auto" />
              <p className="text-sm font-bold text-[#1C1C1F]">
                No tasks in this view
              </p>
              <p className="text-xs text-[#6E6E77]">
                Create a task or delegate items directly from any Note.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const progressPct =
                  task.status === "done"
                    ? 100
                    : task.status === "in_review"
                      ? 75
                      : task.status === "in_progress"
                        ? 45
                        : 15;
                return (
                  <div
                    key={task._id}
                    className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-5 space-y-3 flex flex-col justify-between shadow-[0_2px_10px_rgba(28,28,31,0.03)] hover:shadow-[0_12px_28px_rgba(28,28,31,0.07)] hover:-translate-y-0.5 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-[#1C1C1F]">
                          {task.title}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                            PRIORITY_META[task.priority].badgeClass
                          }`}
                        >
                          {PRIORITY_META[task.priority].label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#6E6E77]">
                          {task.description}
                        </p>
                      )}

                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#6E6E77]">
                          <span>Progress</span>
                          <span className="text-[#1C1C1F] tabular-nums">{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1C1C1F] rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6E77] pt-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F4F4F6] border border-[#E2E2E2] text-[#1C1C1F]">
                          From <strong>{task.createdByName}</strong> →{" "}
                          <strong className="text-[#5432EE]">
                            {task.assignedToName}
                          </strong>
                        </span>
                        {task.projectName && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#EEEEEE] text-[#1C1C1F] font-medium">
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

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#EEEEEE]">
                      <div className="flex items-center gap-2">
                        {task.sourceNoteId && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNoteId(task.sourceNoteId!);
                              setMainTab("notes");
                            }}
                            className="px-3 py-1 bg-[#F4F4F6] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-[11px] font-semibold text-[#5432EE] flex items-center gap-1 cursor-pointer"
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
                          className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
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
                            className="p-1.5 text-[#8A8A93] hover:text-rose-600 cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Enable E2EE Modal */}
      <Modal
        open={encryptModalOpen}
        onClose={() => setEncryptModalOpen(false)}
        title="Enable End-to-End Encryption"
        body={
          <form onSubmit={handleEnableE2ee} className="space-y-4 min-w-[340px] max-w-md">
            <div className="text-xs text-[#0F766E] bg-[#69D7D8]/20 border border-[#69D7D8]/50 rounded-2xl p-3.5 space-y-1">
              <p className="font-bold">Zero-Knowledge Encryption</p>
              <p className="text-[#0F766E]/90">
                Your passphrase stays in your browser and is never sent to the
                server. If you forget it, this note cannot be recovered.
                Encrypted notes are private to your account only.
              </p>
            </div>
            {encryptError && (
              <p className="text-xs text-rose-600 font-medium">{encryptError}</p>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#1C1C1F]">
                Encryption Passphrase (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={encryptPassphrase}
                onChange={(e) => setEncryptPassphrase(e.target.value)}
                placeholder="Enter a strong passphrase"
                className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#1C1C1F]">
                Confirm Passphrase
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={encryptConfirm}
                onChange={(e) => setEncryptConfirm(e.target.value)}
                placeholder="Re-enter passphrase"
                className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEncryptModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] cursor-pointer"
                disabled={encryptSubmitting}
              >
                Cancel
              </button>
              <Button type="submit" disabled={encryptSubmitting}>
                <Lock className="w-3.5 h-3.5" />
                {encryptSubmitting ? "Encrypting..." : "Encrypt Note"}
              </Button>
            </div>
          </form>
        }
      />

      {/* Share Note Modal */}
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Note with GiRe User"
        body={
          <form onSubmit={handleShareNote} className="space-y-4 min-w-[320px]">
            {shareError && (
              <p className="text-xs text-rose-600 font-medium">{shareError}</p>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#1C1C1F]">
                User Email
              </label>
              <input
                type="email"
                required
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] cursor-pointer"
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
              <p className="text-xs text-rose-600 font-medium">{taskError}</p>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#1C1C1F]">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Implement webhook signature check"
                className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#1C1C1F]">
                Instructions / Context
              </label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Additional notes for the assignee..."
                className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#1C1C1F]">
                  Delegate To (User) *
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-xs text-[#1C1C1F]"
                >
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#1C1C1F]">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) =>
                    setTaskPriority(e.target.value as TaskPriority)
                  }
                  className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-xs text-[#1C1C1F]"
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
                <label className="text-xs font-semibold text-[#1C1C1F]">
                  Project
                </label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-xs text-[#1C1C1F]"
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
                <label className="text-xs font-semibold text-[#1C1C1F]">
                  Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-xs text-[#1C1C1F]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] cursor-pointer"
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
