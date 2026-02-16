import IntegrationCard from '../cards/IntegrationCard';
import ListContainer from './ListContainer';

const IntegrationList = ({ integrations, isLoading }: { integrations: any[]; isLoading: boolean }) => {
  if (isLoading) return <div>Loading...</div>;

  const actions = [{ label: 'Add New', href: '#' }];

  return (
    <ListContainer title="Integrations" links={actions}>
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {integrations.map((integration, index) => (
          <IntegrationCard key={index} integration={integration} />
        ))}
      </div>
    </ListContainer>
  );
};

export default IntegrationList;
