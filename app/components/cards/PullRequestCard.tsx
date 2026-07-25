import { getTimeAgo } from "@/lib/utils";
import {
  GitBranch,
  GitPullRequest,
  MessageSquare,
  Minus,
  Plus,
  User,
} from "lucide-react";

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
  const getStatusColor = (status: "merged" | "open" | "closed") => {
    switch (status) {
      case "merged":
        return "bg-purple-950/50 text-purple-300 border-purple-800/50";
      case "open":
        return "bg-emerald-950/50 text-emerald-300 border-emerald-800/50";
      case "closed":
        return "bg-rose-950/50 text-rose-300 border-rose-800/50";
    }
  };

  const statusKey = mergedAt ? "merged" : (state as "merged" | "open" | "closed");

  return (
    <div className="bg-[#131924] border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 hover:bg-[#172030] transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-indigo-950/60 border border-indigo-500/30 rounded-lg flex items-center justify-center shrink-0">
          <GitPullRequest className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <a href={url} target="_blank" rel="noopener noreferrer" className="truncate">
              <h4 className="text-slate-100 font-semibold text-base truncate hover:text-indigo-400 transition-colors">
                {title}
              </h4>
            </a>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border whitespace-nowrap ${getStatusColor(
                statusKey,
              )}`}
            >
              {mergedAt ? "merged" : state}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              {repoName}
            </span>
            <span className="text-slate-600">•</span>
            <span suppressHydrationWarning>{getTimeAgo(updatedAt)}</span>
            {author && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                  <User className="w-3 h-3 text-slate-400" />
                  @{author}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-400">
                <Plus className="w-3.5 h-3.5" />
                {additions}
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <Minus className="w-3.5 h-3.5" />
                {deletions}
              </span>
              <span className="flex items-center gap-1 text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/40">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
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
