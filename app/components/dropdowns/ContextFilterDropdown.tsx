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
        className="px-3.5 py-1.5 bg-[#131924] hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
      >
        <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
        <span>{currentLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#131924] border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                    ? "bg-indigo-950/60 text-indigo-300"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  {label}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            );
          })}

          {projects.length > 0 && (
            <>
              <div className="my-1 border-t border-slate-800/80" />
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                          ? "bg-indigo-950/60 text-indigo-300"
                          : "text-slate-300 hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="truncate pr-2">{p.name}</span>
                      <span className="text-[10px] uppercase text-slate-500 shrink-0">
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

