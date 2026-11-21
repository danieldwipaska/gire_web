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
  { href: "/activity", label: "Activity" },
  { href: "/analytics", label: "Analytics" },
];

const Navbar = ({ session }: { session: NavSession | null }) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <div className="container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                G
              </div>
              <span className="text-xl font-bold text-slate-100 tracking-tight">GiRe</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    pathname.startsWith(item.href)
                      ? "bg-slate-800 text-slate-100 border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
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
                <div className="hidden md:flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-medium text-slate-300" suppressHydrationWarning>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="w-6 h-6 bg-indigo-950 border border-indigo-500/30 rounded-full flex items-center justify-center text-xs font-bold text-indigo-300">
                    {session.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-slate-200 text-xs font-semibold hidden md:block">
                    {session.name}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-slate-100 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
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

        {/* Mobile Nav */}
        {session && (
          <nav className="flex md:hidden items-center gap-1 mt-3 pt-2 border-t border-slate-800/60 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  pathname.startsWith(item.href)
                    ? "bg-slate-800 text-slate-100 border border-slate-700/80"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
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
