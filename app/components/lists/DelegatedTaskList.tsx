"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ListTodo } from "lucide-react";
import { ITask, TaskStatus } from "@/lib/types";
import ListContainer from "./ListContainer";

export default function DelegatedTaskList({ tasks }: { tasks: ITask[] }) {
  const router = useRouter();

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };

  return (
    <ListContainer
      title="Delegated Tasks (Assigned to You)"
      links={[
        {
          label: "Open Notes & Tasks",
          href: "/notes?tab=tasks",
        },
      ]}
    >
      <div className="space-y-3 max-h-96 overflow-auto pr-2">
        {tasks.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">
            No active delegated tasks assigned to you.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#131924] border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <ListTodo className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>From {task.createdByName || "Teammate"}</span>
                    {task.projectName && (
                      <>
                        <span>•</span>
                        <span className="text-slate-300">{task.projectName}</span>
                      </>
                    )}
                    {task.sourceNoteId && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/notes?noteId=${task.sourceNoteId}`}
                          className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          {task.sourceNoteTitle || "View Note"}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <select
                value={task.status}
                onChange={(e) =>
                  handleStatusChange(task._id, e.target.value as TaskStatus)
                }
                className="px-2.5 py-1.5 bg-[#0b0f19] border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 shrink-0"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))
        )}
      </div>
    </ListContainer>
  );
}

