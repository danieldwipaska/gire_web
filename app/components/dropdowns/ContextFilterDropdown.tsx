"use client";

import { useState } from "react";
import { Briefcase, Check, ChevronDown, FolderKanban, Laptop } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IProject } from "@/lib/types";

export default function ContextFilterDropdown({
  projects,
}: {
  projects: IProject[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentContext = searchParams.get("context") || "all";
  const currentProjectId = searchParams.get("project") || "";

  const activeProject = projects.find((p) => p._id === currentProjectId);

  const currentLabel = activeProject
    ? activeProject.name
    : currentContext === "office"
      ? "Office"
      : currentContext === "freelance"
        ? "Freelance"
        : currentContext === "personal"
          ? "Personal"
          : "All Work";

  const applyFilter = (next: { context?: string; project?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("context");
    params.delete("project");
    if (next.project) {
      params.set("project", next.project);
    } else if (next.context && next.context !== "all") {
      params.set("context", next.context);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#EEEEEE] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(28,28,31,0.03)]"
      >
        <FolderKanban className="w-3.5 h-3.5 text-[#5432EE]" />
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6E6E77] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#FFFFFF] border border-[#E2E2E2] rounded-2xl shadow-[0_16px_40px_rgba(28,28,31,0.12)] z-50 overflow-hidden py-1.5 animate-scale-in">
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8A8A93]">
            Workspace Context
          </div>
          {[
            { value: "all", label: "All Work", icon: FolderKanban },
            { value: "office", label: "Office Only", icon: Briefcase },
            { value: "freelance", label: "Freelance Only", icon: Laptop },
          ].map(({ value, label, icon: Icon }) => {
            const isSelected = !currentProjectId && currentContext === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => applyFilter({ context: value })}
                className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#F4F4F6] text-[#5432EE]"
                    : "text-[#1C1C1F] hover:bg-[#F9F9F9]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-[#6E6E77]" />
                  {label}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#5432EE]" />}
              </button>
            );
          })}

          {projects.length > 0 && (
            <>
              <div className="my-1 border-t border-[#EEEEEE]" />
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8A8A93]">
                By Project
              </div>
              <div className="max-h-48 overflow-y-auto">
                {projects.map((p) => {
                  const isSelected = currentProjectId === p._id;
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => applyFilter({ project: p._id })}
                      className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-[#F4F4F6] text-[#5432EE]"
                          : "text-[#1C1C1F] hover:bg-[#F9F9F9]"
                      }`}
                    >
                      <span className="truncate pr-2">{p.name}</span>
                      <span className="text-[10px] uppercase text-[#8A8A93] shrink-0">
                        {p.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
