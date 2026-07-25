import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bug, CheckCircle2, MessageSquare, Sheet, Trash2, Workflow, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { IIntegration } from '@/lib/types';

const iconMap: Record<string, typeof Sheet> = {
  Sheet,
  Bug,
  MessageSquare,
  Workflow,
};

interface Props {
  integration: IIntegration;
}

const IntegrationCard = ({ integration }: Props) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/integrations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: integration._id}),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete integration');
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };
  const IconComponent = iconMap[integration.provider] || Sheet;
  return (
    <div key={integration._id} className="bg-[#131924] border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 hover:bg-[#172030] transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-950/60 border border-indigo-500/30 rounded-lg flex items-center justify-center shrink-0">
          <IconComponent className="w-4 h-4 text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h5 className="text-slate-100 font-semibold text-base">@{integration.githubUsername}</h5>
            {getStatusIcon(integration.status)}
          </div>
          <p className="text-slate-400 text-xs" suppressHydrationWarning>
            Last sync: {formatDistanceToNow(new Date(integration.lastSync), { addSuffix: true })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${getStatusColor(integration.status)}`}>
            {integration.status}
          </span>
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Delete Integration"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationCard;
