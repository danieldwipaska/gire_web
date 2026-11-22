"use client";

import { getTimeAgo } from "@/lib/utils";
import { AlertCircle, ExternalLink, Folder } from "lucide-react";
import { useDetailDrawer } from "../drawer/DetailDrawerProvider";

export interface Props {
  title: string;
  state: string;
  repoName: string;
  url: string;
  updatedAt: string | Date;
}

const IssueCard = ({ title, state, repoName, url, updatedAt }: Props) => {
  const { openDetailByUrl } = useDetailDrawer();
  const isClosed = state.toLowerCase() === "closed";

  return (
    <div
      onClick={() => openDetailByUrl(url)}
      className="bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-4 hover:border-[#418CFF] hover:bg-[#FFFFFF] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(28,28,31,0.06)] transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-[#418CFF]/15 border border-[#418CFF]/25 rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-[#2563EB]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h5 className="text-[#1C1C1F] font-bold text-sm sm:text-base truncate group-hover:text-[#2563EB] transition-colors">
              {title}
            </h5>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap ${
                  isClosed
                    ? "bg-[#EEEEEE] text-[#6E6E77] border-[#E2E2E2]"
                    : "bg-[#418CFF]/15 text-[#2563EB] border-[#418CFF]/30"
                }`}
              >
                {state}
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full text-[#6E6E77] hover:text-[#1C1C1F] hover:bg-[#EEEEEE] transition-colors"
                title="Open on GitHub"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#6E6E77]">
            <span className="flex items-center gap-1.5 font-medium text-[#1C1C1F]">
              <Folder className="w-3.5 h-3.5 text-[#6E6E77]" />
              {repoName}
            </span>
            <span className="text-[#C8C8CE]">•</span>
            <span suppressHydrationWarning>{getTimeAgo(updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
