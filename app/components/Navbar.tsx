"use client";

import { Calendar, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import TopProgressBar from "./TopProgressBar";

interface NavSession {
  id?: string;
  name?: string;
  email?: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/notes", label: "Notes" },
  { href: "/activity", label: "Activity" },
  { href: "/analytics", label: "Analytics" },
];

const Navbar = ({ session }: { session: NavSession | null }) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-line">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <div className="container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center text-white font-bold text-lg shadow-sm">
                G
              </div>
              <span className="text-xl font-bold text-ink tracking-tight">GiRe</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-canvas p-1 rounded-full border border-line">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    pathname.startsWith(item.href)
                      ? "bg-highlight text-ink shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden md:flex items-center space-x-2 bg-highlight border border-line px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5 text-brand-violet" />
                  <span className="text-xs font-medium text-ink-muted" suppressHydrationWarning>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-highlight border border-line rounded-full">
                  <div className="w-6 h-6 bg-ink rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {session.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-ink text-xs font-semibold hidden md:block">
                    {session.name}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="p-2 hover:bg-highlight rounded-full transition-all text-ink-muted hover:text-ink cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-ink hover:bg-ink-hover text-white px-5 py-2 rounded-full text-xs font-semibold transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {session && (
          <nav className="flex md:hidden items-center gap-1 mt-3 pt-2 border-t border-line overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  pathname.startsWith(item.href)
                    ? "bg-ink text-white"
                    : "text-ink-muted hover:text-ink hover:bg-highlight"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
