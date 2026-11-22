"use client";

import { Calendar, CheckCircle, ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TimeDropdown = () => {
  const [rangeOpen, setRangeOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "this-month";

  const RANGE_OPTIONS = [
    { label: "This Week", value: "this-week" },
    { label: "This Month", value: "this-month" },
    { label: "Last 3 Months", value: "last-3-months" },
    { label: "Last 6 Months", value: "last-6-months" },
    { label: "This Year", value: "this-year" },
  ];

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`?${params.toString()}`);
    setRangeOpen(false);
  };

  const currentLabel = RANGE_OPTIONS.find((r) => r.value === currentRange)?.label || "This Month";

  return (
    <div className="relative">
      <button
        type="button"
        className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(28,28,31,0.03)]"
        onClick={() => setRangeOpen((o) => !o)}
      >
        <Calendar className="w-3.5 h-3.5 text-[#5432EE]" />
        <span className="text-[#1C1C1F]">{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6E6E77] transition-transform duration-200 ${rangeOpen ? "rotate-180" : ""}`}
        />
      </button>
      {rangeOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#FFFFFF] border border-[#E2E2E2] rounded-2xl shadow-[0_16px_40px_rgba(28,28,31,0.12)] z-50 overflow-hidden py-1.5 animate-scale-in">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                currentRange === opt.value
                  ? "bg-[#F4F4F6] text-[#5432EE]"
                  : "text-[#1C1C1F] hover:bg-[#F9F9F9]"
              }`}
            >
              {opt.label}
              {currentRange === opt.value && (
                <CheckCircle className="w-3.5 h-3.5 text-[#5432EE]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeDropdown;
