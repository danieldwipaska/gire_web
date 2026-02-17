import { BarChart3, FileText, Target } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Report Your Tasks
          <span className="block text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400 mt-2">
            Automatically & Easily
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Sync your GitHub Pull Requests directly to Google Spreadsheet. Save
          time on daily task reporting with smart automation.
        </p>
        <a
          href="/login"
          className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
        >
          Get Started
        </a>
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            {
              icon: Target,
              color: "purple",
              title: "GitHub Integration",
              desc: "Automatically detect all Pull Requests you worked on today",
            },
            {
              icon: FileText,
              color: "pink",
              title: "Google Sheets (Soon)",
              desc: "Sync directly to your company spreadsheet in one click",
            },
            {
              icon: BarChart3,
              color: "blue",
              title: "Dashboard Analytics",
              desc: "Visualize your progress and performance over time",
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all flex flex-col items-center"
            >
              <div
                className={`w-14 h-14 bg-${color}-500/20 rounded-xl flex items-center justify-center mb-4`}
              >
                <Icon className={`w-8 h-8 text-${color}-400`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
