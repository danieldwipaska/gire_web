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
      <div className="space-y-3 max-h-96 overflow-auto pr-1">
        {tasks.length === 0 ? (
          <p className="text-[#6E6E77] text-sm py-4">
            No active delegated tasks assigned to you.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-[#F9F9F9] border border-[#E2E2E2] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#5432EE]/40 hover:bg-[#FFFFFF] transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#5432EE]/10 border border-[#5432EE]/20 flex items-center justify-center shrink-0">
                  <ListTodo className="w-4 h-4 text-[#5432EE]" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-bold text-[#1C1C1F] truncate">
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6E77]">
                    <span>From {task.createdByName || "Teammate"}</span>
                    {task.projectName && (
                      <>
                        <span>•</span>
                        <span className="text-[#1C1C1F] font-medium">{task.projectName}</span>
                      </>
                    )}
                    {task.sourceNoteId && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/notes?noteId=${task.sourceNoteId}`}
                          className="text-[#5432EE] hover:text-[#418CFF] inline-flex items-center gap-1 font-semibold"
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
                className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E2E2] rounded-full text-xs font-semibold text-[#1C1C1F] shrink-0 cursor-pointer"
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
