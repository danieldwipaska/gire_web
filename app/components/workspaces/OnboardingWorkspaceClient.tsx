"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, RefreshCw } from "lucide-react";

export default function OnboardingWorkspaceClient({
  userName,
}: {
  userName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Workspace");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create Workspace",
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-canvas flex items-center justify-center px-4 py-12 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-72 rounded-full bg-brand-violet/12 blur-3xl animate-float-slow"
      />
      <div className="relative max-w-md w-full space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-ink rounded-2xl flex items-center justify-center mx-auto shadow-[0_8px_20px_rgba(28,28,31,0.18)]">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">
            Create Your First Workspace
          </h2>
          <p className="text-sm text-ink-muted">
            Hi {userName}, as a Super User you need at least one isolated Workspace before entering your dashboard. You can create more Workspaces later.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-line rounded-3xl p-7 space-y-4 shadow-[0_12px_40px_rgba(28,28,31,0.08)]"
        >
          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl p-3 font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Engineering, Freelance Studio"
              className="px-4 py-2.5 bg-canvas/70 border border-line rounded-2xl text-sm text-ink placeholder-ink-subtle focus:outline-none focus:bg-highlight focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/15 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What projects or teams live in this Workspace?"
              className="px-4 py-2.5 bg-canvas/70 border border-line rounded-2xl text-sm text-ink placeholder-ink-subtle focus:outline-none focus:bg-highlight focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/15 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink hover:bg-ink-hover active:scale-[0.99] text-white py-3 rounded-full text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-[0_6px_18px_rgba(28,28,31,0.18)]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Creating Workspace...
              </>
            ) : (
              "Create Workspace & Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
