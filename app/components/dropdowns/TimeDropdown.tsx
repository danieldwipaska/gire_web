"use client";

import { Calendar, CheckCircle, ChevronDown } from "lucide-react";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FloatingDropdownMenu, { useFloatingDropdown } from "./FloatingDropdownMenu";

const TimeDropdown = () => {
  const { open, anchorRef, coords, computeCoords, toggle, close } =
    useFloatingDropdown(192);
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
    close();
  };

  const currentLabel = RANGE_OPTIONS.find((r) => r.value === currentRange)?.label || "This Month";

  return (
    <div ref={anchorRef} className="relative z-50">
      <button
        type="button"
        className="px-4 py-2 bg-card hover:bg-highlight border border-line rounded-full text-xs font-semibold text-ink transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(28,28,31,0.04)]"
        onClick={toggle}
      >
        <Calendar className="w-3.5 h-3.5 text-brand-violet" />
        <span className="text-ink">{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <FloatingDropdownMenu
        open={open}
        onClose={close}
        anchorRef={anchorRef}
        coords={coords}
        onReposition={computeCoords}
        widthClass="w-48"
      >
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
              currentRange === opt.value
                ? "bg-card text-brand-violet"
                : "text-ink hover:bg-card/70"
            }`}
          >
            {opt.label}
            {currentRange === opt.value && (
              <CheckCircle className="w-3.5 h-3.5 text-brand-violet" />
            )}
          </button>
        ))}
      </FloatingDropdownMenu>
    </div>
  );
};

export default TimeDropdown;
