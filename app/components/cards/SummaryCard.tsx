interface Props {
  title: string;
  desc: string;
  value: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

const SummaryCard = (props: Props) => {
  const { title, desc, value, icon, footer } = props;

  return (
    <>
      <div className="bg-white/5 hover:bg-white/10 duration-150 border border-white/10 rounded-lg p-6 flex flex-col gap-2 relative">
        <div className="absolute right-6 top-6">{icon}</div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-white/70 text-sm mb-8">{desc}</p>
        <div className="flex items-center gap-1 absolute bottom-6 left-6">{footer}</div>
      </div>
    </>
  );
};

export default SummaryCard;
