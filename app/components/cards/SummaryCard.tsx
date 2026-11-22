import { AnimatedNumber } from "../ui/MotionPrimitives";

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
    <div className="group bg-card border border-line rounded-2xl p-5 flex flex-col justify-between relative shadow-[0_2px_10px_rgba(28,28,31,0.04)] hover:bg-highlight hover:shadow-[0_12px_28px_rgba(28,28,31,0.08)] hover:-translate-y-0.5 transition-all duration-300 animate-fade-up">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-ink tracking-tight">
            <AnimatedNumber value={value} />
          </p>
        </div>
        <div className="transition-transform duration-300 group-hover:scale-105">
          {icon}
        </div>
      </div>
      <p className="text-ink-muted text-xs leading-relaxed">{desc}</p>
      {footer && (
        <div className="mt-3 pt-2.5 border-t border-line">{footer}</div>
      )}
    </div>
  );
};

export default SummaryCard;
