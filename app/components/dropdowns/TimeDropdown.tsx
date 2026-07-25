"use client";

import { Calendar, CheckCircle, ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import Button from "../buttons/Button";
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
    <>
      <button
        className="px-3.5 py-1.5 bg-[#131924] hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        onClick={() => setRangeOpen((o) => !o)}
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-slate-200">{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${rangeOpen ? "rotate-180" : ""}`}
        />
      </button>
      {rangeOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#131924] border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                currentRange === opt.value
                  ? "bg-indigo-950/60 text-indigo-300"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              {opt.label}
              {currentRange === opt.value && (
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default TimeDropdown;
