"use client";

import { useState } from 'react';
import IntegrationCard from '../cards/IntegrationCard';
import ListContainer from './ListContainer';
import AddIntegrationModal from '../modals/AddIntegrationModal';
import { IIntegration } from '@/lib/types';

const IntegrationList = ({ integrations, isLoading }: { integrations: IIntegration[]; isLoading: boolean }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;

  const actions = [{ label: 'Add New', onClick: () => setIsModalOpen(true) }];

  return (
    <>
      <ListContainer title="Integrations" links={actions}>
        <div className="space-y-3 max-h-125 overflow-auto pr-2">
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No integrations yet. Click "Add New" to connect GitHub.
            </div>
          ) : (
            integrations.map((integration, index) => (
              <IntegrationCard key={index} integration={integration} />
            ))
          )}
        </div>
      </ListContainer>
      <AddIntegrationModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default IntegrationList;
