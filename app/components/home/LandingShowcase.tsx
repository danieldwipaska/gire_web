"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Cloud,
  Figma,
  FileText,
  FolderGit2,
  GitMerge,
  GitPullRequest,
  Kanban,
  KeyRound,
  Link2,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
} from "lucide-react";

type ShowcaseTab = "board" | "github" | "notes" | "projects" | "workspace";

const TABS: {
  id: ShowcaseTab;
  label: string;
  icon: typeof GitPullRequest;
}[] = [
  {
    id: "board",
    label: "Board & Tasks",
    icon: Kanban,
  },
  {
    id: "github",
    label: "GitHub & PR Drawer",
    icon: GitPullRequest,
  },
  {
    id: "notes",
    label: "E2EE Notes & Storage",
    icon: Lock,
  },
  {
    id: "projects",
    label: "Projects & Figma",
    icon: Figma,
  },
  {
    id: "workspace",
    label: "Workspaces & RBAC",
    icon: Building2,
  },
];

export default function LandingShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("board");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  return (
    <div id="showcase" className="relative mx-auto max-w-6xl animate-fade-up-delay-3">
      {/* Subtle Shimmering Pastel Frame */}
      <div className="rounded-[30px] p-[1.5px] bg-gradient-to-r from-[#69D7D8]/55 via-[#418CFF]/45 to-[#EA5DEE]/55 animate-shimmer-border shadow-[0_24px_70px_rgba(28,28,31,0.09)]">
        <div className="rounded-[28.5px] bg-[#FFFFFF] overflow-hidden border border-[#E2E2E2]/80">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[#EEEEEE] bg-[#F9F9F9]/90 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA5DEE]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#418CFF]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#69D7D8]" />
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E2E2E2] text-[11px] font-medium text-[#6E6E77] hidden sm:inline">
                gire.workspace / command-center
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-[#EEEEEE] p-1 rounded-full border border-[#E2E2E2]">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                      active
                        ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_2px_8px_rgba(28,28,31,0.08)]"
                        : "text-[#6E6E77] hover:text-[#1C1C1F]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Preview Stage */}
          <div className="p-4 sm:p-6 min-h-[380px] text-left bg-[#FFFFFF]">
            {activeTab === "board" && (
              <div
                key="board"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-up"
              >
                {/* Mini Left Sidebar Preview */}
                <div className="hidden lg:flex lg:col-span-3 flex-col justify-between bg-[#F9F9F9] border border-[#EEEEEE] rounded-2xl p-3.5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-[#1C1C1F]">
                        Projects
                      </span>
                      <span className="text-[10px] font-semibold text-[#6E6E77]">
                        Active
                      </span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: "Core Auth API", active: false },
                        { label: "Publications UI", active: true },
                        { label: "Payments SDK", active: false },
                        { label: "Design System", active: false },
                      ].map((proj) => (
                        <div
                          key={proj.label}
                          className={`flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium transition-all ${
                            proj.active
                              ? "bg-[#FFFFFF] text-[#1C1C1F] font-semibold shadow-[0_2px_8px_rgba(28,28,31,0.06)] border border-[#E2E2E2]"
                              : "text-[#6E6E77]"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
                            {proj.label}
                          </span>
                          <span className="text-[#8A8A93]">•••</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-[#1C1C1F]">
                          Members
                        </span>
                        <span className="text-[10px] text-[#6E6E77]">
                          View All
                        </span>
                      </div>
                      {[
                        { name: "Julian Hayes", role: "Lead Engineer", color: "bg-[#418CFF]" },
                        { name: "Maya Patel", role: "UX Researcher", color: "bg-[#5432EE]" },
                        { name: "Elena Rossi", role: "Product Manager", color: "bg-[#69D7D8]" },
                      ].map((m) => (
                        <div key={m.name} className="flex items-center gap-2.5 px-1">
                          <div
                            className={`w-6 h-6 rounded-full ${m.color} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}
                          >
                            {m.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#1C1C1F] truncate">
                              {m.name}
                            </p>
                            <p className="text-[10px] text-[#8A8A93] truncate">
                              {m.role}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warm Mesh Promo Card */}
                  <div className="bg-warm-mesh-card rounded-2xl p-3.5 space-y-2.5">
                    <div>
                      <p className="text-xs font-bold text-[#1C1C1F] leading-tight">
                        Meet Your E2EE Vault
                      </p>
                      <p className="text-[10px] text-[#1C1C1F]/75 mt-0.5">
                        Encrypt secrets &amp; delegate tasks in seconds.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("notes")}
                      className="w-full py-1.5 px-3 rounded-full bg-[#1C1C1F] text-white text-[11px] font-semibold flex items-center justify-between cursor-pointer hover:bg-[#2C2C32] transition-colors"
                    >
                      <span>Try Vault</span>
                      <span>›</span>
                    </button>
                  </div>
                </div>

                {/* Right Kanban Workspace */}
                <div className="lg:col-span-9 space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-[#F4F4F6] border border-[#E2E2E2] rounded-full px-3.5 py-2">
                      <Search className="w-3.5 h-3.5 text-[#8A8A93]" />
                      <span className="text-xs text-[#8A8A93]">
                        Search Tasks, PRs, or Notes...
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-3 py-1.5 rounded-full bg-[#F4F4F6] border border-[#E2E2E2] text-[11px] font-semibold text-[#1C1C1F] inline-flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" /> Filters
                      </span>
                      <span className="px-3 py-1.5 rounded-full bg-[#F4F4F6] border border-[#E2E2E2] text-[11px] font-semibold text-[#1C1C1F] hidden sm:inline-flex items-center gap-1">
                        <User className="w-3 h-3" /> Me
                      </span>
                      <span className="px-3.5 py-1.5 rounded-full bg-[#1C1C1F] text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm">
                        <Plus className="w-3 h-3" /> Add Task
                      </span>
                    </div>
                  </div>

                  {/* 3 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Column 1: To Do */}
                    <div className="bg-[#F4F4F6] rounded-2xl p-3 space-y-2.5 border border-[#EEEEEE]">
                      <div className="flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#1C1C1F]">
                          <span className="w-2 h-2 rounded-full bg-[#69D7D8]" />
                          To Do
                        </span>
                        <span className="text-[11px] font-semibold text-[#6E6E77]">
                          12
                        </span>
                      </div>

                      <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E2E2E2]/80 shadow-[0_2px_8px_rgba(28,28,31,0.03)] hover:-translate-y-0.5 transition-all space-y-2.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#418CFF]/15 text-[#2563EB]">
                          Design
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#1C1C1F]">
                            Design Empty State Screens
                          </p>
                          <p className="text-[11px] text-[#6E6E77] mt-1 line-clamp-2">
                            Create crisp illustrations and onboarding copy to boost developer retention.
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex -space-x-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#418CFF] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">J</span>
                            <span className="w-5 h-5 rounded-full bg-[#EA5DEE] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">M</span>
                          </div>
                          <span className="text-[10px] text-[#8A8A93] flex items-center gap-2">
                            <span className="flex items-center gap-0.5"><Link2 className="w-3 h-3" /> 2</span>
                            <span className="flex items-center gap-0.5"><FileText className="w-3 h-3" /> 1</span>
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E2E2E2]/80 shadow-[0_2px_8px_rgba(28,28,31,0.03)] hover:-translate-y-0.5 transition-all space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#5432EE]/12 text-[#5432EE]">
                            Security
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#69D7D8]/20 text-[#0F766E]">
                            Dev
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1C1C1F]">
                          Enforce Workspace RBAC
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[#6E6E77]">
                            <span>Progress</span>
                            <span className="text-[#1C1C1F]">20%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                            <div className="h-full w-1/5 bg-[#1C1C1F] rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: In Progress */}
                    <div className="bg-[#F4F4F6] rounded-2xl p-3 space-y-2.5 border border-[#EEEEEE]">
                      <div className="flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#1C1C1F]">
                          <span className="w-2 h-2 rounded-full bg-[#5432EE]" />
                          In Progress
                        </span>
                        <span className="text-[11px] font-semibold text-[#6E6E77]">
                          23
                        </span>
                      </div>

                      <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E2E2E2]/80 shadow-[0_2px_8px_rgba(28,28,31,0.03)] hover:-translate-y-0.5 transition-all space-y-2.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#69D7D8]/25 text-[#0F766E]">
                          Dev
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#1C1C1F]">
                            Optimize GraphQL Sync
                          </p>
                          <p className="text-[11px] text-[#6E6E77] mt-1 line-clamp-2">
                            Refactor heavy GitHub polling endpoints and batch diff hydration.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[#6E6E77]">
                            <span>Progress</span>
                            <span className="text-[#1C1C1F]">40%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                            <div className="h-full w-2/5 bg-[#1C1C1F] rounded-full" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E2E2E2]/80 shadow-[0_2px_8px_rgba(28,28,31,0.03)] hover:-translate-y-0.5 transition-all space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EA5DEE]/15 text-[#A21CAF]">
                            Figma
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#69D7D8]/25 text-[#0F766E]">
                            Dev
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1C1C1F]">
                          Prototype Embed Sync
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[#6E6E77]">
                            <span>Progress</span>
                            <span className="text-[#1C1C1F]">65%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-[#1C1C1F] rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Review (with Signature Tilted Holographic Card!) */}
                    <div className="bg-[#F4F4F6] rounded-2xl p-3 space-y-2.5 border border-[#EEEEEE]">
                      <div className="flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#1C1C1F]">
                          <span className="w-2 h-2 rounded-full bg-[#EA5DEE]" />
                          Review
                        </span>
                        <span className="text-[11px] font-semibold text-[#6E6E77]">
                          8
                        </span>
                      </div>

                      <div className="bg-[#FFFFFF] rounded-2xl p-3.5 border border-[#E2E2E2]/80 shadow-[0_2px_8px_rgba(28,28,31,0.03)] space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#69D7D8]/25 text-[#0F766E]">
                            Dev
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#418CFF]/15 text-[#2563EB]">
                            Web
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#1C1C1F]">
                          Zero-Knowledge E2EE Vault
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-[#6E6E77]">
                            <span>Progress</span>
                            <span className="text-[#1C1C1F]">80%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#EEEEEE] rounded-full overflow-hidden">
                            <div className="h-full w-4/5 bg-[#1C1C1F] rounded-full" />
                          </div>
                        </div>
                      </div>

                      {/* Dashed Dropzone + Tilted Iridescent Featured Card */}
                      <div className="rounded-2xl border-2 border-dashed border-[#D2D2DA] p-1">
                        <div className="bg-iridescent-card rounded-xl p-3.5 shadow-[0_14px_30px_rgba(65,140,255,0.22)] animate-tilt-float hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 space-y-2.5 cursor-grab">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFFFF]/65 text-[#1C1C1F] backdrop-blur-xs">
                              Design
                            </span>
                            <span className="text-xs font-bold text-[#1C1C1F]/70">
                              •••
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1C1C1F]">
                              Revamp Workspace UI
                            </p>
                            <p className="text-[11px] text-[#1C1C1F]/80 mt-1 line-clamp-2">
                              Crisp neo-grotesque typography, light surfaces, and fluid micro-interactions.
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-0.5">
                            <div className="flex -space-x-1.5 items-center">
                              <span className="w-5 h-5 rounded-full bg-[#1C1C1F] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white/80">
                                A
                              </span>
                              <span className="w-5 h-5 rounded-full bg-[#5432EE] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white/80">
                                +5
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-[#1C1C1F]/75 flex items-center gap-2">
                              <span>10 ☍</span>
                              <span>4 ▤</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "github" && (
              <div
                key="github"
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-up"
              >
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5432EE] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#69D7D8] animate-pulse" />
                      Multi-Account Sync (Office + Freelance)
                    </span>
                    <div className="flex items-center gap-1 bg-[#EEEEEE] p-0.5 rounded-full border border-[#E2E2E2]">
                      {["All", "Office", "Freelance"].map((pill, idx) => (
                        <span
                          key={pill}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            idx === 0
                              ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-xs"
                              : "text-[#6E6E77]"
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
                        "bg-[#69D7D8]/25 text-[#0F766E] border-[#69D7D8]/50",
                    },
                    {
                      title: "fix: webhook signature replay protection",
                      repo: "client/payments-sdk",
                      tag: "Freelance",
                      status: "Review Requested",
                      color:
                        "bg-[#EA5DEE]/15 text-[#A21CAF] border-[#EA5DEE]/35",
                    },
                    {
                      title: "refactor: optimize analytics churn query",
                      repo: "acme/web-portal",
                      tag: "Office",
                      status: "Merged",
                      color:
                        "bg-[#5432EE]/12 text-[#5432EE] border-[#5432EE]/30",
                    },
                  ].map((pr) => (
                    <div
                      key={pr.title}
                      className="bg-[#F9F9F9] border border-[#E2E2E2] hover:border-[#418CFF] hover:bg-[#FFFFFF] rounded-2xl p-4 flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(28,28,31,0.05)]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#1C1C1F] truncate">
                          {pr.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6E6E77]">
                          <span className="font-mono text-[#1C1C1F]">
                            {pr.repo}
                          </span>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E2E2E2] text-[#6E6E77] text-[10px] font-semibold">
                            {pr.tag}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border shrink-0 ${pr.color}`}
                      >
                        {pr.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Simulated Diff Drawer */}
                <div className="lg:col-span-5 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E2E2] pb-2.5">
                    <span className="text-xs font-bold text-[#1C1C1F] flex items-center gap-1.5">
                      <GitMerge className="w-3.5 h-3.5 text-[#5432EE]" />
                      PR Detail Drawer
                    </span>
                    <span className="text-[10px] text-[#0F766E] bg-[#69D7D8]/25 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      CI Passed
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono leading-5 overflow-x-auto bg-[#1C1C1F] rounded-xl p-3">
                    <div className="text-[#418CFF]">
                      @@ -41,4 +41,6 @@ verifyWorkspaceScope
                    </div>
                    <div className="text-rose-300 bg-rose-950/50 px-1.5">
                      - const note = await Note.findById(id);
                    </div>
                    <div className="text-[#69D7D8] bg-emerald-950/40 px-1.5">
                      + const note = await Note.findOne(&#123;
                    </div>
                    <div className="text-[#69D7D8] bg-emerald-950/40 px-1.5">
                      + _id: id, workspaceId: activeWs._id
                    </div>
                    <div className="text-[#69D7D8] bg-emerald-950/40 px-1.5">
                      + &#125;);
                    </div>
                  </pre>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-3 py-1.5 rounded-full bg-[#1C1C1F] text-white text-[11px] font-semibold">
                      Approve PR
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E2E2E2] text-[#1C1C1F] text-[11px] font-semibold">
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
                <div className="lg:col-span-7 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-[#E2E2E2] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#69D7D8]/25 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-[#0F766E]" />
                      </div>
                      <span className="text-sm font-bold text-[#1C1C1F]">
                        Production Credentials Vault
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVaultUnlocked((v) => !v)}
                      className="px-3 py-1.5 rounded-full bg-[#1C1C1F] hover:bg-[#2C2C32] text-white text-[11px] font-semibold cursor-pointer transition-all shadow-xs"
                    >
                      {vaultUnlocked ? "Click to Lock" : "Click to Unlock Demo"}
                    </button>
                  </div>

                  {vaultUnlocked ? (
                    <div className="space-y-2.5 animate-fade-up">
                      <p className="text-[11px] text-[#0F766E] font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Decrypted locally in your browser (PBKDF2 + AES-256-GCM)
                      </p>
                      <pre className="bg-[#1C1C1F] rounded-xl p-3.5 text-xs font-mono text-[#69D7D8]">
                        {`PROD_DB_URL=mongodb+srv://admin:****@cluster0\nSTRIPE_SECRET=sk_live_51Nx...`}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1C1F]">
                        <KeyRound className="w-4 h-4 text-[#5432EE]" />
                        Server-side Zero-Knowledge Ciphertext
                      </div>
                      <p className="text-[11px] font-mono text-[#6E6E77] break-all">
                        gire-e2ee:v1:8fK2mP9q...:vR4xL1...:p9Tz82xQkLm7...
                      </p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1C1C1F]">
                    <Cloud className="w-4 h-4 text-[#418CFF]" />
                    Flexible Image Storage
                  </div>
                  <p className="text-xs text-[#6E6E77] leading-relaxed">
                    Paste screenshots (<kbd className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#E2E2E2] rounded text-[#1C1C1F]">Ctrl+V</kbd>)
                    straight into notes and route them automatically:
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: "Cloudflare R2", state: "Active Option", dot: "bg-[#418CFF]" },
                      { name: "Google Cloud Storage (GCP)", state: "Active Option", dot: "bg-[#5432EE]" },
                      { name: "Local VPS Server (uploads/)", state: "Auto Fallback", dot: "bg-[#69D7D8]" },
                    ].map((s) => (
                      <div
                        key={s.name}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E2E2E2] text-xs"
                      >
                        <span className="flex items-center gap-2 text-[#1C1C1F] font-semibold">
                          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                          {s.name}
                        </span>
                        <span className="text-[10px] font-medium text-[#6E6E77]">
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
                <div className="lg:col-span-5 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1C1C1F]">
                      Core Auth Portal
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#5432EE]/12 text-[#5432EE] text-[10px] font-semibold uppercase">
                      Office
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E77] leading-relaxed">
                    Links GitHub repos, Figma design/prototype frames, project
                    specs, and team tasks in one view.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { label: "Open PRs", val: "4", color: "text-[#0F766E]" },
                      { label: "Issues", val: "7", color: "text-[#418CFF]" },
                      { label: "Merged", val: "29", color: "text-[#5432EE]" },
                    ].map((st) => (
                      <div
                        key={st.label}
                        className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-xl p-2.5 text-center"
                      >
                        <p className={`text-base font-bold ${st.color}`}>
                          {st.val}
                        </p>
                        <p className="text-[10px] text-[#6E6E77]">{st.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1C1F] flex items-center gap-1.5">
                      <Figma className="w-4 h-4 text-[#EA5DEE]" />
                      Inline Figma Prototype Embed
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EA5DEE]/15 text-[#A21CAF] font-semibold">
                      Interactive
                    </span>
                  </div>
                  <div className="h-40 rounded-xl bg-iridescent-card border border-[#E2E2E2] flex items-center justify-center p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-28 h-24 rounded-xl bg-[#FFFFFF] border border-[#E2E2E2] p-2.5 space-y-2 shadow-md">
                        <div className="h-2 w-12 rounded-full bg-[#5432EE]" />
                        <div className="h-1.5 w-16 rounded-full bg-[#EEEEEE]" />
                        <div className="h-6 w-full rounded-lg bg-[#418CFF]/20 border border-[#418CFF]/30" />
                      </div>
                      <div className="text-sm font-bold text-[#1C1C1F]">→</div>
                      <div className="w-28 h-24 rounded-xl bg-[#FFFFFF] border border-[#E2E2E2] p-2.5 space-y-2 shadow-md">
                        <div className="h-2 w-10 rounded-full bg-[#EA5DEE]" />
                        <div className="h-6 w-full rounded-lg bg-[#69D7D8]/30 border border-[#69D7D8]/50" />
                        <div className="h-1.5 w-14 rounded-full bg-[#EEEEEE]" />
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
                <div className="lg:col-span-6 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#1C1C1F] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#5432EE]" />
                      Multi-Tenant Workspace Isolation
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1C1C1F] text-white text-[10px] font-semibold">
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
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs ${
                          w.active
                            ? "bg-[#FFFFFF] border-[#5432EE]/40 text-[#1C1C1F] shadow-xs"
                            : "bg-[#FFFFFF]/60 border-[#E2E2E2] text-[#6E6E77]"
                        }`}
                      >
                        <span className="font-semibold">{w.ws}</span>
                        <span className="text-[11px]">{w.members}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1C1C1F]">
                    <Sparkles className="w-4 h-4 text-[#EA5DEE]" />
                    Strict Privacy Boundaries
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#6E6E77]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 shrink-0" />
                      Projects, Notes &amp; Delegated Tasks stay isolated inside each Workspace.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#418CFF] mt-0.5 shrink-0" />
                      GitHub tokens, PRs &amp; activity remain private per user—never shared across teammates.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5432EE] mt-0.5 shrink-0" />
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
