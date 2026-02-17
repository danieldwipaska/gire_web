import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bug, CheckCircle2, MessageSquare, Sheet, Trash2, Workflow, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, typeof Sheet> = {
  Sheet,
  Bug,
  MessageSquare,
  Workflow,
};

export interface Integration {
  _id: string; // Use _id from MongoDB
  id?: string;
  provider: string;
  githubUsername: string;
  accessToken: string;
  status: 'active' | 'expired';
  lastSync: Date;
}

interface Props {
  integration: Integration;
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
        body: JSON.stringify({ id: integration._id || integration.id }),
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
  const IconComponent = iconMap[integration.provider];
  return (
    <div key={integration._id || integration.id} className="backdrop-blur-md bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center shrink-0">{IconComponent && <IconComponent className="w-5 h-5 text-white" />}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h5 className="text-white font-medium text-lg">{integration.githubUsername}</h5>
            {getStatusIcon(integration.status)}
          </div>
          <p className="text-white/60 text-sm" suppressHydrationWarning>Last sync: {formatDistanceToNow(new Date(integration.lastSync), { addSuffix: true })}</p>
        </div>

        <div className="flex items-center gap-2">
           <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>{integration.status}</span>
           <button 
             onClick={handleDelete} 
             disabled={isDeleting}
             className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
