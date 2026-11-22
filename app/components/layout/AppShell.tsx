"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Crown,
  FileText,
  FolderKanban,
  GitPullRequest,
  Github,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { IWorkspace } from "@/lib/types";
import TopProgressBar from "../TopProgressBar";

export interface AppSession {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function AppShell({
  session,
  isSuperUser = false,
  workspaces = [],
  activeWorkspace = null,
  children,
}: {
  session: AppSession | null;
  isSuperUser?: boolean;
  workspaces?: IWorkspace[];
  activeWorkspace?: IWorkspace | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(true);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);

  const isPublicPage =
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/onboarding");

  if (isPublicPage || !session) {
    return (
      <>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        {pathname === "/" && (
          <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80">
            <div className="container py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  G
                </div>
                <span className="text-xl font-bold text-slate-100 tracking-tight">
                  GiRe
                </span>
              </Link>
              <div className="flex items-center gap-3">
                {session ? (
                  <Link
                    href="/dashboard"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </header>
        )}
        {children}
      </>
    );
  }

  const isGithubSection =
    pathname.startsWith("/github") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/analytics");

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    setWsDropdownOpen(false);
    if (workspaceId === activeWorkspace?._id) return;
    await fetch("/api/workspaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    router.refresh();
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            G
          </div>
          <div>
            <span className="text-lg font-bold text-slate-100 tracking-tight block leading-none">
              GiRe
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Engineer Workspace
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Workspace Switcher */}
      {activeWorkspace && (
        <div className="px-3 pt-3 relative">
          <button
            type="button"
            onClick={() => isSuperUser && setWsDropdownOpen((o) => !o)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0b0f19] border border-slate-800 text-left ${
              isSuperUser
                ? "hover:border-slate-700 cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">
                  {activeWorkspace.name}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  {isSuperUser ? (
                    <>
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      Super User
                    </>
                  ) : (
                    "Member"
                  )}
                </p>
              </div>
            </div>
            {isSuperUser && (
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
          </button>

          {isSuperUser && wsDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-[#131924] border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Switch Workspace
              </div>
              <div className="max-h-44 overflow-y-auto">
                {workspaces.map((ws) => {
                  const isActive = ws._id === activeWorkspace._id;
                  return (
                    <button
                      key={ws._id}
                      type="button"
                      onClick={() => handleSwitchWorkspace(ws._id)}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-indigo-950/60 text-indigo-300"
                          : "text-slate-300 hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="truncate pr-2">{ws.name}</span>
                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="my-1 border-t border-slate-800" />
              <Link
                href="/workspaces"
                onClick={() => {
                  setWsDropdownOpen(false);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-400 hover:bg-slate-800/60"
              >
                <Plus className="w-3.5 h-3.5" />
                Manage / Create Workspace
              </Link>
            </div>
          )}
        </div>
      )}
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            pathname === "/dashboard"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </Link>

        {/* 2. Github (Grouped) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setGithubOpen((o) => !o)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isGithubSection
                ? "bg-slate-800/80 text-slate-100 border border-slate-700/70"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
            }`}
          >
            <span className="flex items-center gap-3">
              <Github className="w-4 h-4 shrink-0" />
              <span>Github</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                githubOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {githubOpen && (
            <div className="mt-1 ml-3 pl-3 border-l border-slate-800 space-y-1">
              <Link
                href="/github/activity"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  pathname.startsWith("/github/activity") ||
                  pathname.startsWith("/activity")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Activity</span>
              </Link>

              <Link
                href="/github/issues-prs"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  pathname.startsWith("/github/issues-prs")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5 shrink-0" />
                <span>Issue and PRs</span>
              </Link>

              <Link
                href="/github/analysis"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  pathname.startsWith("/github/analysis") ||
                  pathname.startsWith("/analytics")
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                <span>Analysis</span>
              </Link>
            </div>
          )}
        </div>

        {/* 3. Projects */}
        <Link
          href="/projects"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            pathname.startsWith("/projects")
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
          }`}
        >
          <FolderKanban className="w-4 h-4 shrink-0" />
          <span>Projects</span>
        </Link>

        {/* 4. Notes */}
        <Link
          href="/notes"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            pathname.startsWith("/notes")
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Notes</span>
        </Link>
        {/* 5. Workspace & Members */}
        <Link
          href="/workspaces"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            pathname.startsWith("/workspaces")
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Workspace</span>
        </Link>
      </nav>

      {/* Footer: Date + User + Sign Out */}
      <div className="p-3 border-t border-slate-800/80 space-y-2.5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0b0f19] border border-slate-800/80">
          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span
            className="text-[11px] font-medium text-slate-400 truncate"
            suppressHydrationWarning
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#0b0f19] border border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-indigo-950 border border-indigo-500/30 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
              {session.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {session.name || "User"}
              </p>
              {session.email && (
                <p className="text-[10px] text-slate-500 truncate">
                  {session.email}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-rose-400 cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#0b0f19]">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#101622] border-r border-slate-800/80 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-68 max-w-[85vw] h-full bg-[#101622] border-r border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-[#131924] border border-slate-800 text-slate-200 cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <span className="font-bold text-slate-100">GiRe</span>
          </Link>
          <div className="w-9" />
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
