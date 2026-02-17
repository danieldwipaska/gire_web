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
      <Button className="flex gap-2 items-center" onClick={() => setRangeOpen((o) => !o)} >
        <Calendar className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-gray-300">{currentLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${rangeOpen ? "rotate-180" : ""}`}
        />
      </Button>
      {rangeOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                currentRange === opt.value
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {opt.label}
              {currentRange === opt.value && (
                <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default TimeDropdown;
