"use client";

import { ProjectCategory } from "@/lib/types";

export type CategoryFilterValue = "all" | ProjectCategory;

const OPTIONS: { value: CategoryFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "office", label: "Office" },
  { value: "freelance", label: "Freelance" },
  { value: "personal", label: "Personal" },
];

export default function CategoryFilterPills({
  value,
  onChange,
}: {
  value: CategoryFilterValue;
  onChange: (next: CategoryFilterValue) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-canvas p-1 border border-line rounded-full">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
            value === opt.value
              ? "bg-highlight text-ink shadow-[0_1px_4px_rgba(28,28,31,0.08)]"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
