'use client';

interface Props {
  tabs: Tab[];
}

interface Tab {
  label: string;
  action: () => void;
  isActive: boolean;
}

const Tabs = (props: Props) => {
  const { tabs } = props;

  return (
    <div className="flex items-center gap-1 bg-[#131924] p-1 border border-slate-800/80 rounded-xl w-fit">
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => {
            tab.action();
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tab.isActive
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
