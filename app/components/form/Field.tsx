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
    <label htmlFor={id} className="block text-xs text-[#1C1C1F] mb-1.5 font-semibold">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A93]" />
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-[#F4F4F6] border rounded-2xl pl-10 pr-10 py-3 text-sm text-[#1C1C1F] placeholder-[#8A8A93] outline-none transition-all focus:bg-[#FFFFFF]
          ${error ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-[#E2E2E2] focus:border-[#5432EE] focus:ring-2 focus:ring-[#5432EE]/15"}`}
      />
      {right && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
    {hint && !error && <p className="text-xs text-[#6E6E77] mt-1">{hint}</p>}
    {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
  </div>
);

export default Field;
