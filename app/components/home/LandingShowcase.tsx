"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Cloud,
  Figma,
  GitMerge,
  GitPullRequest,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type ShowcaseTab = "github" | "notes" | "projects" | "workspace";

const TABS: {
  id: ShowcaseTab;
  label: string;
  badge: string;
  icon: typeof GitPullRequest;
}[] = [
  {
    id: "github",
    label: "GitHub & PR Drawer",
    badge: "User-Oriented",
    icon: GitPullRequest,
  },
  {
    id: "notes",
    label: "E2EE Notes & Storage",
    badge: "Zero-Knowledge",
    icon: Lock,
  },
  {
    id: "projects",
    label: "Projects & Figma",
    badge: "Live Embed",
    icon: Figma,
  },
  {
    id: "workspace",
    label: "Workspaces & RBAC",
    badge: "Multi-Tenant",
    icon: Building2,
  },
];

export default function LandingShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("github");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  return (
    <div className="relative mx-auto max-w-5xl animate-fade-up-delay-3">
      {/* Subtle Animated Glow Frame */}
      <div className="rounded-3xl p-[1px] bg-gradient-to-r from-indigo-500/40 via-emerald-500/30 to-sky-500/40 animate-shimmer-border shadow-2xl shadow-indigo-950/40">
        <div className="rounded-[23px] bg-[#0e1420]/95 backdrop-blur-xl overflow-hidden border border-slate-800/80">
          {/* Interactive Tab Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-[#0b0f19]/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                gire.workspace / preview
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 scale-[1.02]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Stage */}
          <div className="p-5 sm:p-8 min-h-[320px] text-left">
            {activeTab === "github" && (
              <div
                key="github"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-up"
              >
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Multi-Account Sync (Office + Freelance)
                    </span>
                    <div className="flex items-center gap-1">
                      {["All", "Office", "Freelance"].map((pill, idx) => (
                        <span
                          key={pill}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            idx === 0
                              ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                              : "bg-[#131924] text-slate-400 border-slate-800"
                          }`}
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {[
                    {
                      title: "feat: enforce workspace RBAC on task delegation",
                      repo: "acme/core-api",
                      tag: "Office",
                      status: "Approved",
                      color:
                        "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                    },
                    {
                      title: "fix: webhook signature replay protection",
                      repo: "client/payments-sdk",
                      tag: "Freelance",
                      status: "Review Requested",
                      color:
                        "bg-amber-500/15 text-amber-300 border-amber-500/30",
                    },
                    {
                      title: "refactor: optimize analytics churn query",
                      repo: "acme/web-portal",
                      tag: "Office",
                      status: "Merged",
                      color:
                        "bg-purple-500/15 text-purple-300 border-purple-500/30",
                    },
                  ].map((pr) => (
                    <div
                      key={pr.title}
                      className="bg-[#131924] border border-slate-800/90 hover:border-indigo-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-100 truncate">
                          {pr.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-mono text-slate-300">
                            {pr.repo}
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {pr.tag}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${pr.color}`}
                      >
                        {pr.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Simulated Diff Drawer */}
                <div className="lg:col-span-5 bg-[#090d16] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-purple-400" />
                      PR Detail Drawer
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      CI Passed
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono leading-5 overflow-x-auto">
                    <div className="text-indigo-300">
                      @@ -41,4 +41,6 @@ verifyWorkspaceScope
                    </div>
                    <div className="text-rose-300 bg-rose-950/40 px-1.5">
                      - const note = await Note.findById(id);
                    </div>
                    <div className="text-emerald-300 bg-emerald-950/40 px-1.5">
                      + const note = await Note.findOne(&#123;
                    </div>
                    <div className="text-emerald-300 bg-emerald-950/40 px-1.5">
                      + _id: id, workspaceId: activeWs._id
                    </div>
                    <div className="text-emerald-300 bg-emerald-950/40 px-1.5">
                      + &#125;);
                    </div>
                  </pre>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold">
                      Approve PR
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-semibold">
                      Squash &amp; Merge
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div
                key="notes"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-up"
              >
                <div className="lg:col-span-7 bg-[#131924] border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-slate-100">
                        Production Credentials Vault
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVaultUnlocked((v) => !v)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-[11px] font-semibold cursor-pointer transition-colors"
                    >
                      {vaultUnlocked ? "Click to Lock" : "Click to Unlock Demo"}
                    </button>
                  </div>

                  {vaultUnlocked ? (
                    <div className="space-y-2 animate-fade-up">
                      <p className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Decrypted locally in your browser (PBKDF2 + AES-256-GCM)
                      </p>
                      <pre className="bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300">
                        {`PROD_DB_URL=mongodb+srv://admin:****@cluster0\nSTRIPE_SECRET=sk_live_51Nx...`}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-[#0b0f19] border border-emerald-800/40 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <KeyRound className="w-4 h-4 text-emerald-400" />
                        Server-side Zero-Knowledge Ciphertext
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 break-all">
                        gire-e2ee:v1:8fK2mP9q...:vR4xL1...:p9Tz82xQkLm7...
                      </p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 bg-[#131924] border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                    <Cloud className="w-4 h-4 text-amber-400" />
                    Flexible Image Storage
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Paste screenshots (<kbd className="px-1 bg-slate-800 rounded">Ctrl+V</kbd>)
                    straight into notes and route them automatically:
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: "Cloudflare R2", state: "Active Option", dot: "bg-amber-400" },
                      { name: "Google Cloud Storage (GCP)", state: "Active Option", dot: "bg-sky-400" },
                      { name: "Local VPS Server (uploads/)", state: "Auto Fallback", dot: "bg-emerald-400" },
                    ].map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0b0f19] border border-slate-800 text-xs"
                      >
                        <span className="flex items-center gap-2 text-slate-200 font-medium">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                          {s.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {s.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div
                key="projects"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-up"
              >
                <div className="lg:col-span-5 bg-[#131924] border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100">
                      Core Auth Portal
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 text-[10px] font-semibold uppercase">
                      Office
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Links GitHub repos, Figma design/prototype frames, project
                    specs, and team tasks in one view.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { label: "Open PRs", val: "4", color: "text-emerald-400" },
                      { label: "Issues", val: "7", color: "text-sky-400" },
                      { label: "Merged", val: "29", color: "text-purple-400" },
                    ].map((st) => (
                      <div
                        key={st.label}
                        className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5 text-center"
                      >
                        <p className={`text-base font-bold ${st.color}`}>
                          {st.val}
                        </p>
                        <p className="text-[10px] text-slate-500">{st.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-[#131924] border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Figma className="w-4 h-4 text-pink-400" />
                      Inline Figma Prototype Embed
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-pink-950/50 border border-pink-700/40 text-pink-300">
                      Interactive
                    </span>
                  </div>
                  <div className="h-36 rounded-xl bg-gradient-to-br from-[#0b0f19] via-[#12192b] to-[#1a152e] border border-slate-800 flex items-center justify-center p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-20 rounded-lg bg-[#131924] border border-indigo-500/40 p-2 space-y-1.5 shadow-lg">
                        <div className="h-2 w-12 rounded bg-indigo-400/70" />
                        <div className="h-1.5 w-16 rounded bg-slate-700" />
                        <div className="h-5 w-full rounded bg-indigo-600/40 border border-indigo-500/40" />
                      </div>
                      <div className="text-xs text-slate-400">→</div>
                      <div className="w-24 h-20 rounded-lg bg-[#131924] border border-pink-500/40 p-2 space-y-1.5 shadow-lg">
                        <div className="h-2 w-10 rounded bg-pink-400/70" />
                        <div className="h-6 w-full rounded bg-emerald-500/20 border border-emerald-500/30" />
                        <div className="h-1.5 w-14 rounded bg-slate-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "workspace" && (
              <div
                key="workspace"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-up"
              >
                <div className="lg:col-span-6 bg-[#131924] border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      Multi-Tenant Workspace Isolation
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700/40 text-amber-300 text-[10px] font-semibold">
                      Super User
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { ws: "Acme Engineering (Office)", members: "4 Members", active: true },
                      { ws: "Freelance Studio", members: "2 Members", active: false },
                    ].map((w) => (
                      <div
                        key={w.ws}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs ${
                          w.active
                            ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200"
                            : "bg-[#0b0f19] border-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="font-semibold">{w.ws}</span>
                        <span className="text-[11px]">{w.members}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#131924] border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Strict Privacy Boundaries
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      Projects, Notes &amp; Delegated Tasks stay isolated inside each Workspace.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      GitHub tokens, PRs &amp; activity remain private per user—never shared across teammates.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      E2EE Notes stay unlocked only in your browser memory.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
