import { Integration } from '../../../mocks/data.mock';
import { formatDistanceToNow } from 'date-fns';
import { Bug, CheckCircle2, Clock, MessageSquare, Sheet, Workflow, XCircle } from 'lucide-react';

const iconMap: Record<string, typeof Sheet> = {
  Sheet,
  Bug,
  MessageSquare,
  Workflow,
};

interface Props {
  integration: Integration;
}

const IntegrationCard = ({ integration }: Props) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'disconnected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    }
  };
  const IconComponent = iconMap[integration.icon];
  return (
    <div key={integration.id} className="backdrop-blur-md bg-white/5 border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center shrink-0">{IconComponent && <IconComponent className="w-5 h-5 text-white" />}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h5 className="text-white font-medium text-lg">{integration.name}</h5>
            {getStatusIcon(integration.status)}
          </div>
          <p className="text-white/60 text-sm">Last sync: {formatDistanceToNow(integration.lastSync, { addSuffix: true })}</p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>{integration.status}</span>
      </div>
    </div>
  );
};

export default IntegrationCard;
