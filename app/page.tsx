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
  Sparkles,
} from "lucide-react";
import LandingShowcase from "./components/home/LandingShowcase";
import { ScrollReveal } from "./components/ui/MotionPrimitives";

const CORE_FEATURES = [
  {
    icon: LayoutDashboard,
    iconColor: "text-brand-violet",
    bgColor: "bg-brand-violet/10 border-brand-violet/20",
    title: "Engineer Command Center",
    desc: "Unified Dashboard combining Needs Attention queues, Office vs. Freelance breakdowns, active tasks, and GitHub momentum.",
  },
  {
    icon: GitPullRequest,
    iconColor: "text-brand-blue-ink",
    bgColor: "bg-brand-blue/15 border-brand-blue/25",
    title: "Private Multi-Account GitHub",
    desc: "Connect Office, Freelance & Personal GitHub PATs (AES-256-GCM encrypted). Inspect diffs, run reviews, merge, and export daily standups.",
  },
  {
    icon: Figma,
    iconColor: "text-brand-orchid-ink",
    bgColor: "bg-brand-orchid/15 border-brand-orchid/25",
    title: "Projects & Figma Embeds",
    desc: "Organize repositories by context and inspect live Figma designs and clickable prototypes directly alongside project PRs and issues.",
  },
  {
    icon: FileText,
    iconColor: "text-brand-mint-ink",
    bgColor: "bg-brand-mint/25 border-brand-mint/40",
    title: "Notion-Style Notes & Delegation",
    desc: "Rich block editor with syntax-highlighted code, checklists, tables, screenshot paste (Ctrl+V), and Super User task delegation.",
  },
  {
    icon: Lock,
    iconColor: "text-ink",
    bgColor: "bg-card border-canvas",
    title: "End-to-End Encrypted Secret Notes",
    desc: "Optional browser-only PBKDF2 + AES-256-GCM encryption for passwords & company secrets. The server never sees your passphrase or plaintext.",
  },
  {
    icon: Cloud,
    iconColor: "text-brand-blue",
    bgColor: "bg-brand-blue/12 border-brand-blue/25",
    title: "Cloudflare R2, GCP & Local Fallback",
    desc: "Route Note image uploads to Cloudflare R2 or Google Cloud Storage with zero-egress private proxying, or fall back to local VPS storage.",
  },
];

const SECURITY_PILLARS = [
  {
    icon: Building2,
    dot: "bg-brand-violet",
    label: "Multi-Tenant Workspaces",
    detail: "Strict isolation per Workspace with Super User & Member RBAC.",
  },
  {
    icon: ShieldCheck,
    dot: "bg-brand-mint",
    label: "Hardened Security",
    detail: "SSRF protection, XSS HTML sanitization, magic-byte upload checks & token revocation.",
  },
  {
    icon: BarChart3,
    dot: "bg-brand-blue",
    label: "Code Churn & Velocity",
    detail: "Daily code churn, merged PR charts & per-repository breakdown.",
  },
  {
    icon: Activity,
    dot: "bg-brand-orchid",
    label: "Standup-Ready Timeline",
    detail: "Chronological GitHub events with one-click Markdown standup copy.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-canvas overflow-hidden">
      {/* Animated Pastel Iridescent Mesh Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[820px] h-[440px] rounded-full bg-gradient-to-r from-brand-blue/20 via-brand-violet/15 to-brand-orchid/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[440px] -left-40 w-[440px] h-[440px] rounded-full bg-brand-mint/20 blur-3xl animate-float-reverse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[580px] -right-40 w-[440px] h-[440px] rounded-full bg-brand-orchid/15 blur-3xl animate-float-slow"
      />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-7 pt-14 sm:pt-20 pb-24">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-highlight border border-line shadow-[0_2px_10px_rgba(28,28,31,0.05)] text-xs font-semibold text-ink mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-brand-mint animate-pulse" />
            GitHub + Projects + Figma + E2EE Notes in One Workspace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-ink tracking-tight mb-6 animate-fade-up-delay-1">
            Your Unified{" "}
            <span className="bg-brand-gradient-text">
              Engineer Command Center
            </span>
          </h1>

          <p className="text-base sm:text-lg text-ink-muted mb-9 max-w-2xl mx-auto leading-relaxed animate-fade-up-delay-2">
            Monitor multi-account GitHub PRs and reviews, embed interactive
            Figma prototypes, write rich or End-to-End Encrypted notes backed by
            Cloudflare R2 or GCP, and delegate tasks inside isolated Workspaces.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14 animate-fade-up-delay-2">
            <Link
              href="/register"
              className="group bg-ink hover:bg-ink-hover text-white px-7 py-3 rounded-full text-sm sm:text-base font-semibold transition-all shadow-[0_10px_24px_rgba(28,28,31,0.18)] inline-flex items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard"
              className="bg-card hover:bg-highlight border border-line text-ink px-7 py-3 rounded-full text-sm sm:text-base font-semibold transition-all shadow-[0_2px_10px_rgba(28,28,31,0.05)] hover:-translate-y-0.5"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        {/* Interactive Feature Showcase */}
        <LandingShowcase />

        {/* Security & Telemetry Strip */}
        <div id="security" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {SECURITY_PILLARS.map(({ icon: Icon, dot, label, detail }, idx) => (
            <ScrollReveal key={label} delayMs={idx * 70}>
              <div className="h-full bg-card border border-line rounded-2xl p-4 flex items-start gap-3 shadow-[0_2px_10px_rgba(28,28,31,0.04)] hover:bg-highlight hover:shadow-[0_12px_28px_rgba(28,28,31,0.08)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-highlight border border-line flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-ink" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-ink mb-0.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {label}
                  </h2>
                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    {detail}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Core Feature Grid */}
        <div id="features" className="mt-20">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-highlight border border-line text-ink text-[11px] font-semibold mb-3">
                <Sparkles className="w-3 h-3 text-brand-violet" />
                Everything in One Place
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                Built for Office &amp; Freelance Software Engineering
              </h2>
              <p className="text-sm text-ink-muted mt-2">
                Everything you need to ship code, review PRs, document specs, and
                protect sensitive credentials.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CORE_FEATURES.map(
              ({ icon: Icon, iconColor, bgColor, title, desc }, idx) => (
                <ScrollReveal key={title} delayMs={idx * 65}>
                  <div className="h-full group bg-card border border-line rounded-3xl p-6 hover:bg-highlight hover:-translate-y-1 transition-all duration-300 shadow-[0_2px_12px_rgba(28,28,31,0.04)] hover:shadow-[0_18px_40px_rgba(28,28,31,0.09)]">
                    <div
                      className={`w-11 h-11 border rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${bgColor}`}
                    >
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-ink mb-2">
                      {title}
                    </h3>
                    <p className="text-ink-muted text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </ScrollReveal>
              ),
            )}
          </div>
        </div>

        {/* Bottom Iridescent CTA Banner */}
        <ScrollReveal className="mt-20">
          <div className="bg-iridescent-card rounded-3xl p-8 sm:p-10 border border-line shadow-[0_20px_50px_rgba(65,140,255,0.14)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-block px-3 py-1 rounded-full bg-highlight/80 backdrop-blur-xs text-[11px] font-bold text-ink">
                Ready to Launch
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                Organize your engineering workflow with clarity.
              </h2>
              <p className="text-sm text-ink/75">
                Spin up an isolated Workspace, link your GitHub accounts, embed Figma prototypes, and secure sensitive notes end-to-end.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/register"
                className="px-6 py-3 rounded-full bg-ink hover:bg-ink-hover text-white text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                Create Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 rounded-full bg-highlight/90 hover:bg-highlight text-ink text-sm font-semibold border border-line transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
