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
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            Create Your First Workspace
          </h2>
          <p className="text-sm text-slate-400">
            Hi {userName}, as a Super User you need at least one isolated Workspace before entering your dashboard. You can create more Workspaces later.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#131924] border border-slate-800/80 rounded-2xl p-7 space-y-4 shadow-xl"
        >
          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Engineering, Freelance Studio"
              className="px-3.5 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What projects or teams live in this Workspace?"
              className="px-3.5 py-2.5 bg-[#0b0f19] border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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

