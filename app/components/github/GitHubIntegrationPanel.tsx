"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Github,
  KeyRound,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { IIntegration } from "@/lib/types";
import Button from "../buttons/Button";

interface Props {
  integrations: IIntegration[];
}

export default function GitHubIntegrationPanel({ integrations }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(
    integrations[0]?._id || "",
  );
  const [mode, setMode] = useState<"view" | "add" | "edit">(
    integrations.length === 0 ? "add" : "view",
  );

  // Add / Edit form states
  const [label, setLabel] = useState("Office");
  const [githubUsername, setGithubUsername] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeIntegration =
    integrations.find((i) => i._id === selectedId) || integrations[0] || null;

  const startAddMode = () => {
    setError("");
    setNotice("");
    setLabel("Office");
    setGithubUsername("");
    setAccessToken("");
    setMode("add");
  };

  const startEditMode = () => {
    if (!activeIntegration) return;
    setError("");
    setNotice("");
    setLabel(activeIntegration.label || "Personal");
    setAccessToken("");
    setMode("edit");
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "github",
          label,
          githubUsername,
          accessToken,
          status: "active",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to connect GitHub account");
      }

      setSelectedId(data._id || "");
      setGithubUsername("");
      setAccessToken("");
      setMode("view");
      setNotice("GitHub account connected.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect GitHub account",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntegration) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeIntegration._id,
          label,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update GitHub integration");
      }

      setAccessToken("");
      setMode("view");
      setNotice("GitHub integration updated.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update GitHub integration",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeIntegration) return;
    if (
      !confirm(
        `Disconnect GitHub account @${activeIntegration.githubUsername}?`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeIntegration._id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to disconnect integration");
      }

      const remaining = integrations.filter(
        (i) => i._id !== activeIntegration._id,
      );
      setSelectedId(remaining[0]?._id || "");
      setMode(remaining.length === 0 ? "add" : "view");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to disconnect integration",
      );
    } finally {
      setDeleting(false);
    }
  };

  const showAddForm = mode === "add" || integrations.length === 0;

  return (
    <div className="bg-[#0e131d] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Github className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              GitHub Integration
            </h3>
            <p className="text-xs text-slate-400">
              Connect your GitHub username &amp; Personal Access Token
            </p>
          </div>
        </div>

        {integrations.length > 0 && mode === "view" && (
          <button
            type="button"
            onClick={startAddMode}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Account
          </button>
        )}
      </div>

      {integrations.length > 1 && mode !== "add" && (
        <div className="flex flex-wrap gap-1.5">
          {integrations.map((item) => {
            const selected = item._id === activeIntegration?._id;
            return (
              <button
                key={item._id}
                type="button"
                onClick={() => {
                  setSelectedId(item._id);
                  setMode("view");
                  setError("");
                  setNotice("");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  selected
                    ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200"
                    : "bg-[#131924] border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                @{item.githubUsername}
                {item.label ? ` (${item.label})` : ""}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {notice && (
        <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-3 py-2">
          {notice}
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleConnect} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                GitHub Username{" "}
                <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Auto-detected from token"
                className="w-full px-3 py-2 bg-[#131924] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Label
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 bg-[#131924] border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Office">Office</option>
                <option value="Freelance">Freelance</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Personal Access Token (Secret Key)
            </label>
            <input
              type="password"
              required
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3 py-2 bg-[#131924] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Requires <code className="text-slate-400">repo</code> scope in
              GitHub Developer Settings.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {integrations.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMode("view");
                  setError("");
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                disabled={saving}
              >
                Cancel
              </button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Connecting..." : "Connect GitHub"}
            </Button>
          </div>
        </form>
      ) : mode === "edit" && activeIntegration ? (
        <form onSubmit={handleUpdate} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                GitHub Username
              </label>
              <input
                type="text"
                disabled
                value={`@${activeIntegration.githubUsername}`}
                className="w-full px-3 py-2 bg-[#131924]/60 border border-slate-800/80 rounded-lg text-sm text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Label
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 bg-[#131924] border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Office">Office</option>
                <option value="Freelance">Freelance</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              New Personal Access Token{" "}
              <span className="text-slate-500">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3 py-2 bg-[#131924] border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError("");
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              disabled={saving}
            >
              Cancel
            </button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : activeIntegration ? (
        <div className="bg-[#131924] border border-slate-800/80 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-100">
                  @{activeIntegration.githubUsername}
                </span>
                {activeIntegration.label && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                    {activeIntegration.label}
                  </span>
                )}
              </div>
              <p
                className="text-xs text-slate-400 mt-1"
                suppressHydrationWarning
              >
                {activeIntegration.lastSync
                  ? `Last synced ${formatDistanceToNow(new Date(activeIntegration.lastSync), { addSuffix: true })}`
                  : "Connected — not synced yet"}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border shrink-0 ${
                activeIntegration.status === "active"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/30"
              }`}
            >
              {activeIntegration.status === "active" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {activeIntegration.status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={startEditMode}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Update Token
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-xs font-semibold text-rose-300 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Removing..." : "Disconnect"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

