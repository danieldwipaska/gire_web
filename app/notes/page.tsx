import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
import { INote, INoteUser, IProject, ITask } from "@/lib/types";
import NotesClient from "../components/notes/NotesClient";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NotesPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialTab = params.tab === "tasks" ? "tasks" : "notes";
  const initialNoteId =
    typeof params.noteId === "string" ? params.noteId : undefined;
  const initialProjectId =
    typeof params.projectId === "string" ? params.projectId : undefined;

  await connectDB();

  const projectsRaw = await Project.find({
    $or: [{ ownerId: session.id }, { "members.userId": session.id }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  const accessibleProjectIds = projectsRaw.map((p) => p._id);

  const [notesRaw, tasksRaw, usersRaw] = await Promise.all([
    Note.find({
      $or: [
        { userId: session.id },
        { sharedWith: session.id },
        ...(accessibleProjectIds.length > 0
          ? [{ projectId: { $in: accessibleProjectIds } }]
          : []),
      ],
    })
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(200)
      .lean(),
    Task.find({
      $or: [{ assignedTo: session.id }, { createdBy: session.id }],
    })
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean(),
    User.find({})
      .select("_id name email")
      .sort({ name: 1 })
      .limit(100)
      .lean(),
  ]);

  const userMap = new Map(
    usersRaw.map((u) => [
      u._id.toString(),
      { name: u.name, email: u.email },
    ]),
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
      currentUserId={session.id}
      initialNotes={notes}
      initialTasks={tasks}
      projects={JSON.parse(JSON.stringify(projectsRaw)) as IProject[]}
      users={JSON.parse(JSON.stringify(usersRaw)) as INoteUser[]}
      initialTab={initialTab}
      initialNoteId={initialNoteId}
      initialProjectId={initialProjectId}
    />
  );
}

