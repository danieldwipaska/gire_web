"use client";

import { Briefcase, Check, ChevronDown, FolderKanban, Laptop } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IProject } from "@/lib/types";
import FloatingDropdownMenu, { useFloatingDropdown } from "./FloatingDropdownMenu";

export default function ContextFilterDropdown({
  projects,
}: {
  projects: IProject[];
}) {
  const { open, anchorRef, coords, computeCoords, toggle, close } =
    useFloatingDropdown(240);
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
    close();
  };

  return (
    <div ref={anchorRef} className="relative z-50">
      <button
        type="button"
        onClick={toggle}
        className="px-4 py-2 bg-card hover:bg-highlight border border-line rounded-full text-xs font-semibold text-ink transition-all flex items-center gap-2 cursor-pointer shadow-[0_2px_8px_rgba(28,28,31,0.04)]"
      >
        <FolderKanban className="w-3.5 h-3.5 text-brand-violet" />
        <span>{currentLabel}</span>
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
        widthClass="w-60"
      >
        <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
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
                  ? "bg-card text-brand-violet"
                  : "text-ink hover:bg-card/70"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-ink-muted" />
                {label}
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-brand-violet" />}
            </button>
          );
        })}

        {projects.length > 0 && (
          <>
            <div className="my-1 border-t border-line" />
            <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
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
                        ? "bg-card text-brand-violet"
                        : "text-ink hover:bg-card/70"
                    }`}
                  >
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="text-[10px] uppercase text-ink-subtle shrink-0">
                      {p.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </FloatingDropdownMenu>
    </div>
  );
}
