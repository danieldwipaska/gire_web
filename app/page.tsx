import { BarChart3, FileText, GitPullRequest } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-100 tracking-tight mb-6">
          Automate & Track Your <br className="hidden sm:inline" />
          <span className="text-indigo-400">GitHub Pull Requests</span>
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Effortlessly sync your GitHub pull requests, track code activity metrics, and streamline daily task reporting with a clean, unified dashboard.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl text-base font-semibold transition-all shadow-md"
          >
            Get Started
          </a>
          <a
            href="/dashboard"
            className="bg-[#131924] hover:bg-slate-800 border border-slate-800 text-slate-200 px-7 py-3 rounded-xl text-base font-semibold transition-all"
          >
            Go to Dashboard
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-6 mt-20 text-left">
          {[
            {
              icon: GitPullRequest,
              iconColor: "text-indigo-400",
              bgColor: "bg-indigo-950/60 border-indigo-500/30",
              title: "GitHub Integration",
              desc: "Automatically detect, organize, and categorize all PRs and reviews you worked on.",
            },
            // {
            //   icon: FileText,
            //   iconColor: "text-sky-400",
            //   bgColor: "bg-sky-950/60 border-sky-500/30",
            //   title: "Google Sheets Sync",
            //   desc: "Sync pull requests directly to team spreadsheets in one click for daily standups.",
            // },
            {
              icon: BarChart3,
              iconColor: "text-emerald-400",
              bgColor: "bg-emerald-950/60 border-emerald-500/30",
              title: "Analytics & Code Churn",
              desc: "Visualize merged PR velocity, repository activity, and line churn over time.",
            },
          ].map(({ icon: Icon, iconColor, bgColor, title, desc }) => (
            <div
              key={title}
              className="bg-[#131924] border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all"
            >
              <div
                className={`w-11 h-11 border rounded-xl flex items-center justify-center mb-4 ${bgColor}`}
              >
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
