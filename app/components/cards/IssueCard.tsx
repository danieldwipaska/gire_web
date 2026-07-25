import { getTimeAgo } from "@/lib/utils";
import { AlertCircle, Folder } from "lucide-react";

export interface Props {
  title: string;
  state: string;
  repoName: string;
  url: string;
  updatedAt: string | Date;
}

const IssueCard = ({ title, state, repoName, url, updatedAt }: Props) => {
  const isClosed = state.toLowerCase() === "closed";

  return (
    <div className="bg-[#131924] border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 hover:bg-[#172030] transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-sky-950/60 border border-sky-500/30 rounded-lg flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-sky-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <a href={url} target="_blank" rel="noopener noreferrer" className="truncate">
              <h5 className="text-slate-100 font-semibold text-base truncate hover:text-sky-400 transition-colors">
                {title}
              </h5>
            </a>
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border whitespace-nowrap ${
                isClosed
                  ? "bg-slate-900 text-slate-400 border-slate-800"
                  : "bg-sky-950/50 text-sky-300 border-sky-800/50"
              }`}
            >
              {state}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              {repoName}
            </span>
            <span className="text-slate-600">•</span>
            <span suppressHydrationWarning>{getTimeAgo(updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
