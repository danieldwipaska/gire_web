import { GitBranch, GitPullRequest, MessageSquare, Minus, Plus } from 'lucide-react';

interface Props {
  title: string;
  state: string;
  repoName: string;
  additions: number;
  deletions: number;
  comments: number;
  url: string;
  mergedAt: string | null;
}

const PullRequestCard = ({ title, state, repoName, additions, deletions, comments, url, mergedAt }: Props) => {
  const getStatusColor = (status: any) => {
    switch (status) {
      case 'merged':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'open':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };
  return (
    <>
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center shrink-0">
            <GitPullRequest className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <a href={url}>
                <h4 className="text-white font-medium line-clamp-2 hover:underline cursor-pointer">{title}</h4>
              </a>
              <span className={`px-2 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${getStatusColor(mergedAt ? 'merged' : state)}`}>{mergedAt ? 'merged' : state}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
              <span className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                {repoName}
              </span>
              <span>4 days ago</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-400">
                  <Plus className="w-4 h-4" />
                  {additions}
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <Minus className="w-4 h-4" />
                  {deletions}
                </span>
                <span className="flex items-center gap-1 text-white/60">
                  <MessageSquare className="w-4 h-4" />
                  {comments}
                </span>
              </div>

              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-400 to-cyan-400 border-2 border-white/20 flex items-center justify-center text-xs font-semibold text-white" title={'Alice Johnson'}>
                  A
                </div>
                <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-400 to-cyan-400 border-2 border-white/20 flex items-center justify-center text-xs font-semibold text-white" title={'Alice Johnson'}>
                  A
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PullRequestCard;
