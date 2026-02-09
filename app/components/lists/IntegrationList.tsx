import { mockIntegrations } from '../../../mocks/data.mock';
import IntegrationCard from '../cards/IntegrationCard';
import ListContainer from './ListContainer';

const IntegrationList = () => {
  const actions = [{ label: 'Add New', href: '#' }];

  return (
    <ListContainer title="Integrations" actions={actions}>
      <div className="space-y-3 max-h-125 overflow-auto pr-2">
        {mockIntegrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </ListContainer>
  );
};

export default IntegrationList;
