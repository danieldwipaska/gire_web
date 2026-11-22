import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  Cloud,
  Figma,
  FileText,
  GitPullRequest,
  LayoutDashboard,
  Lock,
  ShieldCheck,
} from "lucide-react";
import LandingShowcase from "./components/home/LandingShowcase";

const CORE_FEATURES = [
  {
    icon: LayoutDashboard,
    iconColor: "text-indigo-400",
    bgColor: "bg-indigo-950/60 border-indigo-500/30",
    title: "Engineer Command Center",
    desc: "Unified Dashboard combining Needs Attention queues, Office vs. Freelance breakdowns, active tasks, and GitHub momentum.",
  },
  {
    icon: GitPullRequest,
    iconColor: "text-sky-400",
    bgColor: "bg-sky-950/60 border-sky-500/30",
    title: "Private Multi-Account GitHub",
    desc: "Connect Office, Freelance & Personal GitHub PATs (AES-256-GCM encrypted). Inspect diffs, run reviews, merge, and export daily standups.",
  },
  {
    icon: Figma,
    iconColor: "text-pink-400",
    bgColor: "bg-pink-950/60 border-pink-500/30",
    title: "Projects & Figma Embeds",
    desc: "Organize repositories by context and inspect live Figma designs and clickable prototypes directly alongside project PRs and issues.",
  },
  {
    icon: FileText,
    iconColor: "text-amber-400",
    bgColor: "bg-amber-950/60 border-amber-500/30",
    title: "Notion-Style Notes & Delegation",
    desc: "Rich block editor with syntax-highlighted code, checklists, tables, screenshot paste (Ctrl+V), and Super User task delegation.",
  },
  {
    icon: Lock,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-950/60 border-emerald-500/30",
    title: "End-to-End Encrypted Secret Notes",
    desc: "Optional browser-only PBKDF2 + AES-256-GCM encryption for passwords & company secrets. The server never sees your passphrase or plaintext.",
  },
  {
    icon: Cloud,
    iconColor: "text-cyan-400",
    bgColor: "bg-cyan-950/60 border-cyan-500/30",
    title: "Cloudflare R2, GCP & Local Fallback",
    desc: "Route Note image uploads to Cloudflare R2 or Google Cloud Storage with zero-egress private proxying, or fall back to local VPS storage.",
  },
];

const SECURITY_PILLARS = [
  {
    icon: Building2,
    label: "Multi-Tenant Workspaces",
    detail: "Strict isolation per Workspace with Super User & Member RBAC.",
  },
  {
    icon: ShieldCheck,
    label: "Hardened Security",
    detail: "SSRF protection, XSS HTML sanitization, magic-byte upload checks & token revocation.",
  },
  {
    icon: BarChart3,
    label: "Code Churn & Velocity",
    detail: "Daily code churn, merged PR charts & per-repository breakdown.",
  },
  {
    icon: Activity,
    label: "Standup-Ready Timeline",
    detail: "Chronological GitHub events with one-click Markdown standup copy.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0b0f19] overflow-hidden">
      {/* Animated Ambient Background Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[780px] h-[440px] rounded-full bg-indigo-600/15 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[460px] -left-40 w-[420px] h-[420px] rounded-full bg-emerald-500/10 blur-3xl animate-float-reverse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[620px] -right-40 w-[420px] h-[420px] rounded-full bg-sky-500/10 blur-3xl animate-float-slow"
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-24">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131924]/90 border border-slate-800 text-xs font-semibold text-indigo-300 mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GitHub + Projects + Figma + E2EE Notes in One Workspace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-100 tracking-tight mb-6 animate-fade-up-delay-1">
            Your Unified{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              Engineer Command Center
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 mb-9 max-w-2xl mx-auto leading-relaxed animate-fade-up-delay-2">
            Monitor multi-account GitHub PRs and reviews, embed interactive
            Figma prototypes, write rich or End-to-End Encrypted notes backed by
            Cloudflare R2 or GCP, and delegate tasks inside isolated Workspaces.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14 animate-fade-up-delay-2">
            <Link
              href="/register"
              className="group bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/dashboard"
              className="bg-[#131924] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 px-7 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all hover:-translate-y-0.5"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        {/* Interactive Feature Showcase */}
        <LandingShowcase />

        {/* Security & Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {SECURITY_PILLARS.map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              className="bg-[#131924]/70 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-100 mb-0.5">
                  {label}
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Core Feature Grid */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Built for Office &amp; Freelance Software Engineering
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Everything you need to ship code, review PRs, document specs, and
              protect sensitive credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_FEATURES.map(({ icon: Icon, iconColor, bgColor, title, desc }) => (
              <div
                key={title}
                className="group bg-[#131924] border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-950/30"
              >
                <div
                  className={`w-11 h-11 border rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${bgColor}`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">
                  {title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
