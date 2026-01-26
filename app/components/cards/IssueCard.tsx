import { AlertCircle, Tag } from 'lucide-react';

const IssueCard = () => {
  const getPriorityColor = (priority: any) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-linear-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h5 className="text-white font-medium line-clamp-2 hover:underline cursor-pointer text-lg">Button styling inconsistent on mobile</h5>
            <span className={`px-2 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${getPriorityColor('high')}`}>high</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/60 mb-3">
            <span>company/main-app</span>
            <span>•</span>
            <span>5 days ago</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-md text-xs text-white/80">
              <Tag className="w-3 h-3" />
              bug
            </span>
            <span className="flex items-center gap-1 px-2 py-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-md text-xs text-white/80">
              <Tag className="w-3 h-3" />
              ui
            </span>
            <span className="flex items-center gap-1 px-2 py-1 backdrop-blur-md bg-white/10 border border-white/20 rounded-md text-xs text-white/80">
              <Tag className="w-3 h-3" />
              mobile
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
