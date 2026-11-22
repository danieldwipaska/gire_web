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
    <div className="bg-[#FFFFFF] border border-[#E2E2E2] rounded-3xl p-5 flex flex-col justify-between shadow-[0_2px_12px_rgba(28,28,31,0.03)]">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EEEEEE]">
          <h3 className="text-base font-bold text-[#1C1C1F] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#418CFF]" />
            Recent GitHub Activity
          </h3>
          <Link
            href="/github/activity"
            className="text-xs font-semibold text-[#5432EE] hover:text-[#418CFF] inline-flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-[#6E6E77] py-4">
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
                className="bg-[#F9F9F9] border border-[#E2E2E2] hover:border-[#418CFF] hover:bg-[#FFFFFF] rounded-2xl p-3.5 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-[#1C1C1F] truncate">
                    {ev.title}
                  </p>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#EEEEEE] text-[#1C1C1F] shrink-0">
                    {ev.type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#6E6E77] mt-1">
                  <span className="flex items-center gap-1 text-[#1C1C1F] font-medium truncate">
                    <GitBranch className="w-3 h-3 text-[#6E6E77] shrink-0" />
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
