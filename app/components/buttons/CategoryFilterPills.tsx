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
    <div className="flex items-center gap-1 bg-[#0b0f19] p-0.5 border border-slate-800 rounded-lg">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
            value === opt.value
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

