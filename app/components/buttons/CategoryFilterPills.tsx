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
    <div className="flex items-center gap-1 bg-[#EEEEEE] p-1 border border-[#E2E2E2] rounded-full">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
            value === opt.value
              ? "bg-[#FFFFFF] text-[#1C1C1F] shadow-[0_1px_4px_rgba(28,28,31,0.08)]"
              : "text-[#6E6E77] hover:text-[#1C1C1F]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
