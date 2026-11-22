"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
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
  Sparkles,
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

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl";
  return (
    <div
      className={`${dim} bg-[#1C1C1F] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(28,28,31,0.18)] shrink-0`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={size === "sm" ? "w-4 h-4" : "w-5 h-5"}
        aria-hidden="true"
      >
        <rect x="4" y="4" width="6.5" height="16" rx="3.25" fill="currentColor" />
        <circle cx="16.5" cy="8.5" r="3.5" fill="currentColor" />
        <rect x="13" y="13.5" width="7" height="6.5" rx="3.25" fill="#69D7D8" />
      </svg>
    </div>
  );
}

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
          <header className="sticky top-0 z-40 bg-[#FFFFFF]/80 backdrop-blur-xl border-b border-[#E2E2E2]">
            <div className="max-w-7xl mx-auto px-5 sm:px-7 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <BrandMark size="md" />
                <span className="text-xl font-bold text-[#1C1C1F] tracking-tight">
                  GiRe
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1 bg-[#EEEEEE] p-1 rounded-full border border-[#E2E2E2]">
                <a
                  href="#showcase"
                  className="px-3.5 py-1 rounded-full text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-white transition-all"
                >
                  Workspace Preview
                </a>
                <a
                  href="#security"
                  className="px-3.5 py-1 rounded-full text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-white transition-all"
                >
                  Security
                </a>
                <a
                  href="#features"
                  className="px-3.5 py-1 rounded-full text-xs font-semibold text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-white transition-all"
                >
                  Capabilities
                </a>
              </nav>

              <div className="flex items-center gap-2.5">
                {session ? (
                  <Link
                    href="/dashboard"
                    className="bg-[#1C1C1F] hover:bg-[#2C2C32] text-white px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(28,28,31,0.16)] hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-[#1C1C1F] hover:bg-[#EEEEEE] transition-colors"
                    >
                      Register
                    </Link>
                    <Link
                      href="/login"
                      className="bg-[#1C1C1F] hover:bg-[#2C2C32] text-white px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(28,28,31,0.16)] hover:-translate-y-0.5"
                    >
                      Sign In
                    </Link>
                  </>
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

  const railLinks = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/github/issues-prs",
      icon: GitPullRequest,
      label: "Issues & PRs",
      active: isGithubSection,
    },
    {
      href: "/projects",
      icon: FolderKanban,
      label: "Projects",
      active: pathname.startsWith("/projects"),
    },
    {
      href: "/notes",
      icon: FileText,
      label: "Notes",
      active: pathname.startsWith("/notes"),
    },
    {
      href: "/workspaces",
      icon: Building2,
      label: "Workspace",
      active: pathname.startsWith("/workspaces"),
    },
  ];

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header (mobile & compact) */}
      <div className="px-4 py-4 border-b border-[#E2E2E2] flex items-center justify-between">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5"
        >
          <div className="md:hidden">
            <BrandMark size="sm" />
          </div>
          <div>
            <span className="text-base font-bold text-[#1C1C1F] tracking-tight block leading-none">
              GiRe
            </span>
            <span className="text-[11px] text-[#6E6E77] font-medium">
              Engineer Workspace
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-full text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE] cursor-pointer"
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
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#E2E2E2] text-left shadow-[0_1px_4px_rgba(28,28,31,0.03)] transition-all ${
              isSuperUser
                ? "hover:border-[#C8C8CE] cursor-pointer"
                : "cursor-default"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#EEF2FF] border border-[#5432EE]/20 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-[#5432EE]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1C1C1F] truncate">
                  {activeWorkspace.name}
                </p>
                <p className="text-[10px] text-[#6E6E77] flex items-center gap-1 font-medium">
                  {isSuperUser ? (
                    <>
                      <Crown className="w-2.5 h-2.5 text-amber-500" />
                      Super User
                    </>
                  ) : (
                    "Member"
                  )}
                </p>
              </div>
            </div>
            {isSuperUser && (
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#8A8A93] shrink-0" />
            )}
          </button>

          {isSuperUser && wsDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1.5 bg-[#FFFFFF] border border-[#E2E2E2] rounded-2xl shadow-[0_16px_40px_rgba(28,28,31,0.12)] z-50 py-1.5 animate-scale-in">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8A8A93]">
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
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#F4F4F6] text-[#5432EE]"
                          : "text-[#1C1C1F] hover:bg-[#F9F9F9]"
                      }`}
                    >
                      <span className="truncate pr-2">{ws.name}</span>
                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-[#5432EE] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="my-1 border-t border-[#EEEEEE]" />
              <Link
                href="/workspaces"
                onClick={() => {
                  setWsDropdownOpen(false);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#5432EE] hover:bg-[#F9F9F9]"
              >
                <Plus className="w-3.5 h-3.5" />
                Manage / Create Workspace
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* 1. Dashboard */}
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            pathname === "/dashboard"
              ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_2px_10px_rgba(28,28,31,0.06)] border border-[#E2E2E2]"
              : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isGithubSection
                ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_2px_10px_rgba(28,28,31,0.05)] border border-[#E2E2E2]"
                : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
            }`}
          >
            <span className="flex items-center gap-3">
              <Github className="w-4 h-4 shrink-0" />
              <span>Github</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#8A8A93] transition-transform duration-200 ${
                githubOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {githubOpen && (
            <div className="mt-1.5 ml-4 pl-3 border-l border-[#E2E2E2] space-y-1">
              <Link
                href="/github/activity"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/github/activity") ||
                  pathname.startsWith("/activity")
                    ? "bg-[#1C1C1F] text-white shadow-xs"
                    : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Activity</span>
              </Link>

              <Link
                href="/github/issues-prs"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/github/issues-prs")
                    ? "bg-[#1C1C1F] text-white shadow-xs"
                    : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5 shrink-0" />
                <span>Issue and PRs</span>
              </Link>

              <Link
                href="/github/analysis"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  pathname.startsWith("/github/analysis") ||
                  pathname.startsWith("/analytics")
                    ? "bg-[#1C1C1F] text-white shadow-xs"
                    : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
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
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            pathname.startsWith("/projects")
              ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_2px_10px_rgba(28,28,31,0.06)] border border-[#E2E2E2]"
              : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
          }`}
        >
          <FolderKanban className="w-4 h-4 shrink-0" />
          <span>Projects</span>
        </Link>

        {/* 4. Notes */}
        <Link
          href="/notes"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            pathname.startsWith("/notes")
              ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_2px_10px_rgba(28,28,31,0.06)] border border-[#E2E2E2]"
              : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Notes</span>
        </Link>

        {/* 5. Workspace & Members */}
        <Link
          href="/workspaces"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            pathname.startsWith("/workspaces")
              ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_2px_10px_rgba(28,28,31,0.06)] border border-[#E2E2E2]"
              : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]/70"
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Workspace</span>
        </Link>
      </nav>

      {/* Spotlight Card (inspired by reference sidebar gradient card) */}
      <div className="px-3 pb-3">
        <div className="bg-warm-mesh-card rounded-2xl p-3.5 relative overflow-hidden border border-[#E2E2E2]/60 shadow-[0_6px_18px_rgba(234,93,238,0.12)]">
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#1C1C1F]/70">
              <Sparkles className="w-3 h-3" />
              E2EE Vault &amp; Specs
            </div>
            <p className="text-xs font-bold text-[#1C1C1F] leading-snug">
              Zero-Knowledge Notes &amp; Task Delegation
            </p>
            <Link
              href="/notes"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-full bg-[#1C1C1F] hover:bg-[#2C2C32] text-white text-[11px] font-semibold transition-all"
            >
              <span>Open Notes</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer: Date + User + Sign Out */}
      <div className="p-3 border-t border-[#E2E2E2] space-y-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E2E2E2]">
          <Calendar className="w-3.5 h-3.5 text-[#5432EE] shrink-0" />
          <span
            className="text-[11px] font-medium text-[#6E6E77] truncate"
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

        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-[#FFFFFF] border border-[#E2E2E2]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-[#1C1C1F] rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              {session.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1C1C1F] truncate">
                {session.name || "User"}
              </p>
              {session.email && (
                <p className="text-[10px] text-[#6E6E77] truncate">
                  {session.email}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 hover:bg-[#EEEEEE] rounded-full transition-colors text-[#6E6E77] hover:text-rose-600 cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F9F9F9]">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>

      {/* Desktop Dual-Panel Sidebar: Left Icon Rail + Main Nav Panel */}
      <aside className="hidden md:flex md:w-[276px] md:fixed md:inset-y-0 z-30 border-r border-[#E2E2E2] bg-[#F9F9F9]">
        {/* Compact Icon Rail */}
        <div className="w-14 bg-[#FFFFFF] border-r border-[#E2E2E2] flex flex-col items-center justify-between py-4 shrink-0">
          <Link href="/dashboard" aria-label="GiRe Home">
            <BrandMark size="md" />
          </Link>

          <div className="flex flex-col items-center gap-2">
            {railLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                    item.active
                      ? "bg-[#1C1C1F] text-white shadow-[0_4px_12px_rgba(28,28,31,0.22)] scale-105"
                      : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </Link>
              );
            })}
          </div>

          <div className="w-8 h-8 rounded-full bg-[#F4F4F6] border border-[#E2E2E2] flex items-center justify-center text-xs font-bold text-[#1C1C1F]">
            {session.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>

        {/* Workspace & Full Nav Panel */}
        <div className="flex-1 min-w-0 bg-[#F9F9F9]">{navContent}</div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex bg-[#1C1C1F]/35 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] h-full bg-[#F9F9F9] border-r border-[#E2E2E2] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-[276px] flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E2E2E2]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-full bg-[#F4F4F6] border border-[#E2E2E2] text-[#1C1C1F] cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="font-bold text-[#1C1C1F]">GiRe</span>
          </Link>
          <div className="w-9" />
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
