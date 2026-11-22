"use client";

import { getTimeAgo } from "@/lib/utils";
import {
  ExternalLink,
  GitBranch,
  GitPullRequest,
  MessageSquare,
  Minus,
  Plus,
  User,
} from "lucide-react";
import { useDetailDrawer } from "../drawer/DetailDrawerProvider";

export interface Props {
  title: string;
  state: string;
  repoName: string;
  additions: number;
  deletions: number;
  comments?: number;
  url: string;
  updatedAt: string | Date;
  mergedAt?: string | Date | null;
  author?: string;
}

const PullRequestCard = ({
  title,
  state,
  repoName,
  additions,
  deletions,
  comments = 0,
  url,
  updatedAt,
  mergedAt,
  author,
}: Props) => {
  const { openDetailByUrl } = useDetailDrawer();

  const getStatusColor = (status: "merged" | "open" | "closed") => {
    switch (status) {
      case "merged":
        return "bg-[#5432EE]/12 text-[#5432EE] border-[#5432EE]/25";
      case "open":
        return "bg-[#69D7D8]/25 text-[#0F766E] border-[#69D7D8]/50";
      case "closed":
        return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  const statusKey = mergedAt ? "merged" : (state as "merged" | "open" | "closed");

  return (
    <div
      onClick={() => openDetailByUrl(url)}
      className="bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-4 hover:border-[#5432EE]/45 hover:bg-[#FFFFFF] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(28,28,31,0.06)] transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-[#5432EE]/10 border border-[#5432EE]/20 rounded-xl flex items-center justify-center shrink-0">
          <GitPullRequest className="w-4 h-4 text-[#5432EE]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-[#1C1C1F] font-bold text-sm sm:text-base truncate group-hover:text-[#5432EE] transition-colors">
              {title}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border whitespace-nowrap ${getStatusColor(
                  statusKey,
                )}`}
              >
                {mergedAt ? "merged" : state}
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

          <div className="flex items-center gap-3 text-xs text-[#6E6E77] mb-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-[#1C1C1F]">
              <GitBranch className="w-3.5 h-3.5 text-[#6E6E77]" />
              {repoName}
            </span>
            <span className="text-[#C8C8CE]">•</span>
            <span suppressHydrationWarning>{getTimeAgo(updatedAt)}</span>
            {author && (
              <>
                <span className="text-[#C8C8CE]">•</span>
                <span className="flex items-center gap-1 text-[#1C1C1F] font-medium bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E2E2E2]">
                  <User className="w-3 h-3 text-[#6E6E77]" />
                  @{author}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#EEEEEE]">
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-[#0F766E]">
                <Plus className="w-3.5 h-3.5" />
                {additions}
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <Minus className="w-3.5 h-3.5" />
                {deletions}
              </span>
              <span className="flex items-center gap-1 text-[#6E6E77] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E2E2E2]">
                <MessageSquare className="w-3.5 h-3.5 text-[#6E6E77]" />
                {comments} {comments === 1 ? "comment" : "comments"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PullRequestCard;
