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

  // Create Workspace Modal
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [wsLoading, setWsLoading] = useState(false);
  const [wsError, setWsError] = useState("");

  // Create Member Form
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">
            Workspace &amp; Members
          </h2>
          <p className="text-sm text-slate-400">
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
      <div className="bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            {isSuperUser ? `Your Workspaces (${workspaces.length})` : "Your Workspace"}
          </h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">
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
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSuperUser ? "cursor-pointer" : "cursor-default"
                } ${
                  isActive
                    ? "bg-indigo-950/50 border-indigo-500/60"
                    : "bg-[#0b0f19] border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-100 truncate">
                    {ws.name}
                  </span>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white flex items-center gap-1 shrink-0">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                {ws.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {ws.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Members Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`${
            isSuperUser ? "lg:col-span-7" : "lg:col-span-12"
          } bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4`}
        >
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Members in {activeWorkspace.name} ({members.length})
          </h3>

          <div className="space-y-2.5">
            {members.map((m) => {
              const isOwner = m.role !== "member";
              return (
                <div
                  key={m._id}
                  className="flex items-center justify-between gap-3 bg-[#0b0f19] border border-slate-800 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {m.name}
                      </p>
                      {m._id === currentUserId && (
                        <span className="text-[10px] text-slate-400">(You)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{m.email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border flex items-center gap-1 ${
                        isOwner
                          ? "bg-amber-950/50 text-amber-300 border-amber-700/50"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {isOwner && <Crown className="w-3 h-3" />}
                      {isOwner ? "Super User" : "Member"}
                    </span>
                    {isSuperUser && !isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m._id, m.email)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
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
          <div className="lg:col-span-5 bg-[#131924] border border-slate-800/80 rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              Create Member in {activeWorkspace.name}
            </h3>
            <p className="text-xs text-slate-400">
              Regular users cannot self-register. Create an account here so they can sign in, view their own GitHub activity, and work on delegated tasks inside this Workspace.
            </p>

            {memberError && (
              <div className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/50 rounded-lg p-2.5">
                {memberError}
              </div>
            )}
            {memberSuccess && (
              <div className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/50 rounded-lg p-2.5">
                {memberSuccess}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Budi Santoso"
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="budi@company.com"
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Initial Password (min 6 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="••••••"
                  className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs text-slate-100"
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
            {wsError && <p className="text-xs text-rose-400">{wsError}</p>}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Workspace Name *
              </label>
              <input
                type="text"
                required
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="e.g. Freelance Client X"
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Description
              </label>
              <textarea
                rows={2}
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
                className="px-3 py-2 bg-[#0b0f19] border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWsModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
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

