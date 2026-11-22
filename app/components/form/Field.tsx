import type { ComponentType, ChangeEvent, ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  icon: ComponentType<{ className?: string }>;
  right?: ReactNode;
  hint?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const Field = ({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  right,
  hint,
  value,
  onChange,
  error,
}: FieldProps) => (
  <div>
    <label htmlFor={id} className="block text-xs text-ink mb-1.5 font-semibold">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-canvas/75 border rounded-2xl pl-10 pr-10 py-3 text-sm text-ink placeholder-ink-subtle outline-none transition-all focus:bg-highlight
          ${error ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-line focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/15"}`}
      />
      {right && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
    {hint && !error && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
  </div>
);

export default Field;
