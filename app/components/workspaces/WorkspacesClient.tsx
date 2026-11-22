"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  Crown,
  Lock,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { IWorkspace } from "@/lib/types";
import Button from "../buttons/Button";
import Modal from "../modals/Modal";

interface WorkspaceMemberItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export default function WorkspacesClient({
  currentUserId,
  isSuperUser,
  workspaces,
  activeWorkspace,
  members,
}: {
  currentUserId: string;
  isSuperUser: boolean;
  workspaces: IWorkspace[];
  activeWorkspace: IWorkspace;
  members: WorkspaceMemberItem[];
}) {
  const router = useRouter();

  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [wsLoading, setWsLoading] = useState(false);
  const [wsError, setWsError] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [memberSuccess, setMemberSuccess] = useState("");

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (workspaceId === activeWorkspace._id) return;
    await fetch("/api/workspaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    router.refresh();
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setWsLoading(true);
    setWsError("");
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: wsName, description: wsDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Workspace");
      setWsModalOpen(false);
      setWsName("");
      setWsDesc("");
      router.refresh();
    } catch (err) {
      setWsError(
        err instanceof Error ? err.message : "Failed to create Workspace",
      );
    } finally {
      setWsLoading(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberLoading(true);
    setMemberError("");
    setMemberSuccess("");
    try {
      const res = await fetch("/api/workspaces/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberName,
          email: memberEmail,
          password: memberPassword,
          workspaceId: activeWorkspace._id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create member");
      setMemberName("");
      setMemberEmail("");
      setMemberPassword("");
      setMemberSuccess(`Created member account for ${data.email}`);
      router.refresh();
    } catch (err) {
      setMemberError(
        err instanceof Error ? err.message : "Failed to create member",
      );
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`Remove member ${email} from ${activeWorkspace.name}?`)) return;
    const res = await fetch("/api/workspaces/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center animate-fade-up">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-ink tracking-tight">
            Workspace &amp; Members
          </h2>
          <p className="text-sm text-ink-muted">
            Isolated tenant workspace for projects, notes, and task delegations. GitHub data remains private per user.
          </p>
        </div>
        {isSuperUser && (
          <Button onClick={() => setWsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Workspace
          </Button>
        )}
      </div>

      {/* Workspaces Grid */}
      <div className="bg-card border border-line rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)] animate-fade-up-delay-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-violet" />
            {isSuperUser ? `Your Workspaces (${workspaces.length})` : "Your Workspace"}
          </h3>
          <span className="text-xs text-ink-muted flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Strictly isolated tenant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {workspaces.map((ws) => {
            const isActive = ws._id === activeWorkspace._id;
            return (
              <button
                key={ws._id}
                type="button"
                onClick={() => isSuperUser && handleSwitchWorkspace(ws._id)}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  isSuperUser ? "cursor-pointer" : "cursor-default"
                } ${
                  isActive
                    ? "bg-iridescent-card border-brand-violet/30 shadow-[0_8px_20px_rgba(65,140,255,0.16)]"
                    : "bg-highlight border-line hover:border-brand-violet/40 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink truncate">
                    {ws.name}
                  </span>
                  {isActive && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-ink text-white flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                {ws.description && (
                  <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                    {ws.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Members Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up-delay-2">
        <div
          className={`${
            isSuperUser ? "lg:col-span-7" : "lg:col-span-12"
          } bg-card border border-line rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(28,28,31,0.04)]`}
        >
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-mint-ink" />
            Members in {activeWorkspace.name} ({members.length})
          </h3>

          <div className="space-y-2.5">
            {members.map((m) => {
              const isOwner = m.role !== "member";
              return (
                <div
                  key={m._id}
                  className="flex items-center justify-between gap-3 bg-highlight border border-canvas rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {m.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink truncate">
                          {m.name}
                        </p>
                        {m._id === currentUserId && (
                          <span className="text-[10px] text-ink-muted">(You)</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted truncate">{m.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border flex items-center gap-1 ${
                        isOwner
                          ? "bg-brand-orchid/15 text-brand-orchid-ink border-brand-orchid/30"
                          : "bg-card text-ink border-canvas"
                      }`}
                    >
                      {isOwner && <Crown className="w-3 h-3" />}
                      {isOwner ? "Super User" : "Member"}
                    </span>
                    {isSuperUser && !isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m._id, m.email)}
                        className="p-1.5 text-ink-subtle hover:text-rose-600 cursor-pointer"
                        title="Delete Member Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isSuperUser && (
          <div className="lg:col-span-5 bg-card border border-line rounded-3xl p-5 space-y-4 h-fit shadow-[0_2px_12px_rgba(28,28,31,0.04)]">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-violet" />
              Create Member in {activeWorkspace.name}
            </h3>
            <p className="text-xs text-ink-muted">
              Regular users cannot self-register. Create an account here so they can sign in, view their own GitHub activity, and work on delegated tasks inside this Workspace.
            </p>

            {memberError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl p-3 font-medium">
                {memberError}
              </div>
            )}
            {memberSuccess && (
              <div className="text-xs text-brand-mint-ink bg-brand-mint/20 border border-brand-mint/40 rounded-2xl p-3 font-medium">
                {memberSuccess}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Budi Santoso"
                  className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="budi@company.com"
                  className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-ink">
                  Initial Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="••••••"
                  className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-xs text-ink"
                />
              </div>

              <Button type="submit" disabled={memberLoading} className="w-full">
                {memberLoading ? "Creating Member..." : "Create Member Account"}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Modal
        open={wsModalOpen}
        onClose={() => setWsModalOpen(false)}
        title="Create New Workspace"
        body={
          <form
            onSubmit={handleCreateWorkspace}
            className="space-y-4 min-w-[330px]"
          >
            {wsError && <p className="text-xs text-rose-600 font-medium">{wsError}</p>}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-ink">
                Workspace Name *
              </label>
              <input
                type="text"
                required
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="e.g. Freelance Client X"
                className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-sm text-ink"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-ink">
                Description
              </label>
              <textarea
                rows={2}
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
                className="px-3.5 py-2 bg-highlight border border-line rounded-2xl text-sm text-ink"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWsModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <Button type="submit" disabled={wsLoading}>
                {wsLoading ? "Creating..." : "Create Workspace"}
              </Button>
            </div>
          </form>
        }
      />
    </div>
  );
}
