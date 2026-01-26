import { Bell, LogOut, Settings, Target, User } from 'lucide-react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Target className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white">GiRe</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium">
                Dashboard
              </Link>
              <Link href="" className="px-4 py-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all">
                Analytics
              </Link>
              <Link href="" className="px-4 py-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all">
                Integrations
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-all">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <Settings className="w-5 h-5 text-white" />
            </button>
            <div className="h-8 w-px bg-white/20" />
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-all">
              <div className="w-8 h-8 bg-linear-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-white text-sm hidden md:block">You</span>
            </button>
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/70 hover:text-white">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
