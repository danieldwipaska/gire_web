import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWorkspaceUsers, requirePageWorkspaceContext } from "@/lib/workspace";
import WorkspacesClient from "../components/workspaces/WorkspacesClient";

export default async function WorkspacesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await requirePageWorkspaceContext(session.id);
  const members = await getWorkspaceUsers(ctx.activeWorkspace._id);

  return (
    <WorkspacesClient
      currentUserId={ctx.userId}
      isSuperUser={ctx.isSuperUser}
      workspaces={ctx.workspaces}
      activeWorkspace={ctx.activeWorkspace}
      members={members}
    />
  );
}

