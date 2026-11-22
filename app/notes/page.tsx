import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { getWorkspaceUsers, requirePageWorkspaceContext } from "@/lib/workspace";
import Note from "@/models/Note";
import Project from "@/models/Project";
import StorageIntegration from "@/models/StorageIntegration";
import Task from "@/models/Task";
import {
  sanitizeStorageIntegration,
  StorageIntegrationDoc,
} from "@/lib/storage/upload";
import {
  INote,
  INoteUser,
  IProject,
  IStorageIntegration,
  ITask,
} from "@/lib/types";
import NotesClient from "../components/notes/NotesClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NotesPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await requirePageWorkspaceContext(session.id);
  const workspaceId = ctx.activeWorkspace._id;

  const params = await searchParams;
  const initialTab =
    params.tab === "tasks"
      ? "tasks"
      : params.tab === "integrations"
        ? "integrations"
        : "notes";
  const initialNoteId =
    typeof params.noteId === "string" ? params.noteId : undefined;
  const initialProjectId =
    typeof params.projectId === "string" ? params.projectId : undefined;

  await connectDB();

  const [projectsRaw, workspaceUsers] = await Promise.all([
    Project.find({ workspaceId }).sort({ updatedAt: -1 }).lean(),
    getWorkspaceUsers(workspaceId),
  ]);

  const accessibleProjectIds = projectsRaw.map((p) => p._id);

  const [notesRaw, tasksRaw, storageRaw] = await Promise.all([
    Note.find({
      workspaceId,
      $or: [
        { userId: session.id },
        { isEncrypted: { $ne: true }, sharedWith: session.id },
        ...(accessibleProjectIds.length > 0
          ? [
              {
                isEncrypted: { $ne: true },
                projectId: { $in: accessibleProjectIds },
              },
            ]
          : []),
      ],
    })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(200)
      .lean(),
    Task.find({
      workspaceId,
      $or: [{ assignedTo: session.id }, { createdBy: session.id }],
    })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean(),
    StorageIntegration.find({ userId: session.id }).lean(),
  ]);

  const storageIntegrations: IStorageIntegration[] = (
    storageRaw as unknown as StorageIntegrationDoc[]
  ).map(sanitizeStorageIntegration);

  const userMap = new Map(
    workspaceUsers.map((u) => [u._id, { name: u.name, email: u.email }]),
  );
  const projectMap = new Map(
    projectsRaw.map((p) => [p._id.toString(), p.name]),
  );
  const noteTitleMap = new Map(
    notesRaw.map((n) => [n._id.toString(), n.title]),
  );

  const notes: INote[] = JSON.parse(JSON.stringify(notesRaw)).map(
    (n: INote) => ({
      ...n,
      authorName: userMap.get(n.userId)?.name || "Unknown",
      projectName: n.projectId ? projectMap.get(n.projectId) || null : null,
    }),
  );

  const tasks: ITask[] = JSON.parse(JSON.stringify(tasksRaw)).map(
    (t: ITask) => ({
      ...t,
      createdByName: userMap.get(t.createdBy)?.name || "Unknown",
      assignedToName: userMap.get(t.assignedTo)?.name || "Unknown",
      assignedToEmail: userMap.get(t.assignedTo)?.email || "",
      projectName: t.projectId ? projectMap.get(t.projectId) || null : null,
      sourceNoteTitle: t.sourceNoteId
        ? noteTitleMap.get(t.sourceNoteId) || null
        : null,
    }),
  );

  return (
    <NotesClient
      key={workspaceId}
      currentUserId={session.id}
      isSuperUser={ctx.isSuperUser}
      initialNotes={notes}
      initialTasks={tasks}
      initialStorageIntegrations={storageIntegrations}
      projects={JSON.parse(JSON.stringify(projectsRaw)) as IProject[]}
      users={workspaceUsers as INoteUser[]}
      initialTab={initialTab}
      initialNoteId={initialNoteId}
      initialProjectId={initialProjectId}
    />
  );
}
