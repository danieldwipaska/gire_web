import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import OnboardingWorkspaceClient from "../../components/workspaces/OnboardingWorkspaceClient";

export default async function OnboardingWorkspacePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const ctx = await getWorkspaceContext(session.id);
  if (!ctx) {
    redirect("/login");
  }

  if (!ctx.isSuperUser || ctx.workspaces.length > 0) {
    redirect("/dashboard");
  }

  return <OnboardingWorkspaceClient userName={ctx.userName} />;
}

