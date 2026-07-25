interface Props {
  title: string;
  desc: string;
  value: number;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

const SummaryCard = (props: Props) => {
  const { title, desc, value, icon, footer } = props;

  return (
    <div className="bg-[#131924] border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between relative hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-100">{value}</p>
        </div>
        {icon}
      </div>
      <p className="text-slate-400 text-xs">{desc}</p>
      {footer && <div className="mt-3 pt-2 border-t border-slate-800/60">{footer}</div>}
    </div>
  );
};

export default SummaryCard;
