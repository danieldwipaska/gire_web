"use client";

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
    <div className="flex items-center gap-1 bg-[#EEEEEE] p-1 border border-[#E2E2E2] rounded-full w-fit">
      {tabs.map((tab, index) => (
        <button
          key={index}
          onClick={() => {
            tab.action();
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            tab.isActive
              ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_2px_8px_rgba(28,28,31,0.08)]"
              : "text-[#6E6E77] hover:text-[#1C1C1F]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
