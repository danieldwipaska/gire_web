"use client";

import { Calendar, LogOut, Target, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = ({ session }: { session: any }) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Target className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white">GiRe</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className={`px-4 py-2 ${pathname.startsWith("/dashboard") ? "bg-white/10 border border-white/20 rounded-lg text-white font-medium" : "hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"}`}
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className={`px-4 py-2 ${pathname.startsWith("/analytics") ? "bg-white/10 border border-white/20 rounded-lg text-white font-medium" : "hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"}`}
              >
                Analytics
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden md:flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-300">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-all">
                  <div className="w-8 h-8 bg-linear-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-sm hidden md:block">
                    {session.name}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/70 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
