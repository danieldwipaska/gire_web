import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import { IProject } from "@/lib/types";

export interface ContextScope {
  projects: IProject[];
  allowedRepos: string[] | null;
  activeContext: string;
  activeProjectId: string;
}

export const getContextScope = async (
  userId: string,
  contextParam?: string,
  projectParam?: string,
  workspaceId?: string,
): Promise<ContextScope> => {
  await connectDB();

  const query = workspaceId
    ? { workspaceId }
    : { $or: [{ ownerId: userId }, { "members.userId": userId }] };

  const projectsRaw = await Project.find(query)
    .sort({ updatedAt: -1 })
    .lean();

  const projects = JSON.parse(JSON.stringify(projectsRaw)) as IProject[];

  const activeProjectId = projectParam || "";
  const activeContext = contextParam || "all";

  if (activeProjectId) {
    const found = projects.find((p) => p._id === activeProjectId);
    return {
      projects,
      allowedRepos: found ? found.repos || [] : [],
      activeContext: found?.category || "all",
      activeProjectId,
    };
  }

  if (
    activeContext === "office" ||
    activeContext === "freelance" ||
    activeContext === "personal"
  ) {
    const repoSet = new Set<string>();
    for (const p of projects) {
      if (p.category === activeContext) {
        for (const r of p.repos || []) {
          repoSet.add(r);
        }
      }
    }
    return {
      projects,
      allowedRepos: Array.from(repoSet),
      activeContext,
      activeProjectId: "",
    };
  }

  return {
    projects,
    allowedRepos: null,
    activeContext: "all",
    activeProjectId: "",
  };
};
