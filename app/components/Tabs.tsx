'use client';

import { useState } from 'react';

interface Props {
  tabs: Tab[];
}

interface Tab {
  label: string;
  action: () => void;
}

const Tabs = (props: Props) => {
  const { tabs } = props;
  const [selectedTab, setSelectedTab] = useState<string>(tabs[0].label);

  return (
    <>
      <div className="flex items-center gap-1">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedTab(tab.label);
              tab.action();
            }}
            className={`px-4 py-2 hover:bg-white/10 hover:text-white rounded-lg font-medium ${selectedTab === tab.label ? 'bg-white/10 border border-white/20 text-white' : 'hover:bg-white/10 text-white/70 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default Tabs;
