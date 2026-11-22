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
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/85 backdrop-blur-xl border-b border-[#E2E2E2]">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <div className="container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-[#1C1C1F] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                G
              </div>
              <span className="text-xl font-bold text-[#1C1C1F] tracking-tight">GiRe</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-[#EEEEEE] p-1 rounded-full border border-[#E2E2E2]">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    pathname.startsWith(item.href)
                      ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-xs"
                      : "text-[#6E6E77] hover:text-[#1C1C1F]"
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
                <div className="hidden md:flex items-center space-x-2 bg-[#F4F4F6] border border-[#E2E2E2] px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5 text-[#5432EE]" />
                  <span className="text-xs font-medium text-[#6E6E77]" suppressHydrationWarning>
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E2E2] rounded-full">
                  <div className="w-6 h-6 bg-[#1C1C1F] rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {session.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-[#1C1C1F] text-xs font-semibold hidden md:block">
                    {session.name}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="p-2 hover:bg-[#EEEEEE] rounded-full transition-all text-[#6E6E77] hover:text-[#1C1C1F] cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-[#1C1C1F] hover:bg-[#2C2C32] text-white px-5 py-2 rounded-full text-xs font-semibold transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {session && (
          <nav className="flex md:hidden items-center gap-1 mt-3 pt-2 border-t border-[#EEEEEE] overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  pathname.startsWith(item.href)
                    ? "bg-[#1C1C1F] text-white"
                    : "text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE]"
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
