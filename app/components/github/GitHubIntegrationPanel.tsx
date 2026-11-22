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
    <div className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-[0_2px_12px_rgba(28,28,31,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1C1C1F] flex items-center justify-center shrink-0">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1C1C1F] tracking-tight">
              GitHub Integration
            </h3>
            <p className="text-xs text-[#6E6E77]">
              Connect your GitHub username &amp; Personal Access Token
            </p>
          </div>
        </div>

        {integrations.length > 0 && mode === "view" && (
          <button
            type="button"
            onClick={startAddMode}
            className="text-xs font-semibold text-[#5432EE] hover:text-[#418CFF] flex items-center gap-1 cursor-pointer shrink-0"
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
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  selected
                    ? "bg-[#1C1C1F] border-[#1C1C1F] text-white"
                    : "bg-[#F4F4F6] border-[#E2E2E2] text-[#6E6E77] hover:text-[#1C1C1F]"
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
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-3.5 py-2.5 font-medium">
          {error}
        </div>
      )}
      {notice && (
        <div className="text-xs text-[#0F766E] bg-[#69D7D8]/20 border border-[#69D7D8]/40 rounded-2xl px-3.5 py-2.5 font-medium">
          {notice}
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleConnect} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1C1F] mb-1">
                GitHub Username{" "}
                <span className="text-[#8A8A93] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="Auto-detected from token"
                className="w-full px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F] placeholder-[#8A8A93] focus:outline-none focus:bg-white focus:border-[#5432EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1C1F] mb-1">
                Account Label
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F] focus:outline-none focus:bg-white focus:border-[#5432EE]"
              >
                <option value="Office">Office</option>
                <option value="Freelance">Freelance</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1C1F] mb-1">
              Personal Access Token (Secret Key)
            </label>
            <input
              type="password"
              required
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F] placeholder-[#8A8A93] focus:outline-none focus:bg-white focus:border-[#5432EE]"
            />
            <p className="text-[11px] text-[#6E6E77] mt-1">
              Requires <code className="px-1 py-0.5 bg-[#EEEEEE] rounded text-[#1C1C1F]">repo</code> scope in
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
                className="px-3.5 py-2 text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] cursor-pointer"
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
              <label className="block text-xs font-semibold text-[#1C1C1F] mb-1">
                GitHub Username
              </label>
              <input
                type="text"
                disabled
                value={`@${activeIntegration.githubUsername}`}
                className="w-full px-3.5 py-2 bg-[#EEEEEE] border border-[#E2E2E2] rounded-2xl text-sm text-[#6E6E77]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1C1F] mb-1">
                Account Label
              </label>
              <select
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F] focus:outline-none focus:bg-white focus:border-[#5432EE]"
              >
                <option value="Office">Office</option>
                <option value="Freelance">Freelance</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1C1F] mb-1">
              New Personal Access Token{" "}
              <span className="text-[#8A8A93] font-normal">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3.5 py-2 bg-[#F4F4F6] border border-[#E2E2E2] rounded-2xl text-sm text-[#1C1C1F] placeholder-[#8A8A93] focus:outline-none focus:bg-white focus:border-[#5432EE]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setMode("view");
                setError("");
              }}
              className="px-3.5 py-2 text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] cursor-pointer"
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
        <div className="bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-[#1C1C1F]">
                  @{activeIntegration.githubUsername}
                </span>
                {activeIntegration.label && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#5432EE]/10 text-[#5432EE] border border-[#5432EE]/20">
                    {activeIntegration.label}
                  </span>
                )}
              </div>
              <p
                className="text-xs text-[#6E6E77] mt-1"
                suppressHydrationWarning
              >
                {activeIntegration.lastSync
                  ? `Last synced ${formatDistanceToNow(new Date(activeIntegration.lastSync), { addSuffix: true })}`
                  : "Connected — not synced yet"}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shrink-0 ${
                activeIntegration.status === "active"
                  ? "bg-[#69D7D8]/25 text-[#0F766E] border-[#69D7D8]/50"
                  : "bg-rose-100 text-rose-700 border-rose-200"
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

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#EEEEEE]">
            <button
              type="button"
              onClick={startEditMode}
              className="px-3.5 py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#EEEEEE] border border-[#E2E2E2] text-xs font-semibold text-[#1C1C1F] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#5432EE]" />
              Update Token
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
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
