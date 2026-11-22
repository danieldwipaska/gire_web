"use client";

import Link from "next/link";
import { Activity, ArrowRight, GitBranch } from "lucide-react";
import { IActivityEvent } from "@/lib/types";
import { getTimeAgo, parseGitHubUrl } from "@/lib/utils";
import { useDetailDrawer } from "../drawer/DetailDrawerProvider";

export default function RecentActivityCard({
  events,
}: {
  events: IActivityEvent[];
}) {
  const { openDetailByUrl } = useDetailDrawer();

  return (
    <div className="bg-[#131924] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Recent GitHub Activity
          </h3>
          <Link
            href="/github/activity"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">
            No recorded GitHub activity yet. Click Sync Now to fetch events.
          </p>
        ) : (
          <div className="space-y-2.5">
            {events.map((ev) => (
              <div
                key={ev._id}
                onClick={() => {
                  if (parseGitHubUrl(ev.url)) {
                    openDetailByUrl(ev.url);
                  } else {
                    window.open(ev.url, "_blank", "noopener,noreferrer");
                  }
                }}
                className="bg-[#0b0f19] border border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-3 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {ev.title}
                  </p>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                    {ev.type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <span className="flex items-center gap-1 text-slate-400 truncate">
                    <GitBranch className="w-3 h-3 shrink-0" />
                    {ev.repoName}
                  </span>
                  <span>•</span>
                  <span className="shrink-0" suppressHydrationWarning>
                    {getTimeAgo(ev.occurredAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

