import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import connectDB from "@/lib/mongodb";
import { isSuperUserRole, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import { IWorkspace } from "@/lib/types";
import Note from "@/models/Note";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
import Workspace from "@/models/Workspace";

export interface ActiveWorkspaceContext {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  isSuperUser: boolean;
  workspaces: IWorkspace[];
  activeWorkspace: IWorkspace | null;
}

export async function getWorkspaceContext(
  userId: string,
  cookieWorkspaceId?: string,
): Promise<ActiveWorkspaceContext | null> {
  await connectDB();

  const user = await User.findById(userId)
    .select("_id name email role workspaceId activeWorkspaceId")
    .lean();
  if (!user) return null;

  const isSuper = isSuperUserRole(user.role);

  if (!isSuper) {
    // Regular member: strictly bound to their single workspaceId
    if (!user.workspaceId) {
      return {
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        role: user.role,
        isSuperUser: false,
        workspaces: [],
        activeWorkspace: null,
      };
    }

    const ws = await Workspace.findById(user.workspaceId).lean();
    const workspaces = ws
      ? ([JSON.parse(JSON.stringify(ws))] as IWorkspace[])
      : [];

    return {
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      isSuperUser: false,
      workspaces,
      activeWorkspace: workspaces[0] || null,
    };
  }

  // Super User: can own and switch between >1 Workspaces
  const ownedWorkspacesRaw = await Workspace.find({ ownerId: user._id })
    .sort({ createdAt: 1 })
    .lean();

  const workspaces = JSON.parse(
    JSON.stringify(ownedWorkspacesRaw),
  ) as IWorkspace[];

  if (workspaces.length === 0) {
    return {
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      role: user.role,
      isSuperUser: true,
      workspaces: [],
      activeWorkspace: null,
    };
  }

  let cookieWsId = cookieWorkspaceId;
  if (!cookieWsId) {
    try {
      const cookieStore = await cookies();
      cookieWsId = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;
    } catch {
      cookieWsId = undefined;
    }
  }

  const preferredId = cookieWsId || user.activeWorkspaceId?.toString();
  const activeWorkspace =
    workspaces.find((w) => w._id === preferredId) || workspaces[0];

  // Backfill any legacy workspace-less records owned by this Super User
  await Promise.all([
    Project.updateMany(
      { ownerId: user._id, workspaceId: null },
      { workspaceId: workspaces[0]._id },
    ),
    Note.updateMany(
      { userId: user._id, workspaceId: null },
      { workspaceId: workspaces[0]._id },
    ),
    Task.updateMany(
      { createdBy: user._id, workspaceId: null },
      { workspaceId: workspaces[0]._id },
    ),
  ]);

  return {
    userId: user._id.toString(),
    userName: user.name,
    userEmail: user.email,
    role: user.role,
    isSuperUser: true,
    workspaces,
    activeWorkspace,
  };
}

/**
 * For Server Component pages: ensures user is logged in and has an active Workspace.
 * Forces newly registered Super Users without a Workspace to /onboarding/workspace.
 */
export async function requirePageWorkspaceContext(userId: string) {
  const ctx = await getWorkspaceContext(userId);
  if (!ctx) {
    redirect("/login");
  }
  if (!ctx.activeWorkspace) {
    if (ctx.isSuperUser) {
      redirect("/onboarding/workspace");
    }
    redirect("/login");
  }
  return {
    ...ctx,
    activeWorkspace: ctx.activeWorkspace,
  };
}

/**
 * Checks whether targetUserId belongs to workspaceId (as owner or member).
 */
export async function isUserInWorkspace(
  targetUserId: string,
  workspaceId: string,
): Promise<boolean> {
  await connectDB();
  const ws = await Workspace.findById(workspaceId).select("ownerId").lean();
  if (!ws) return false;
  if (ws.ownerId.toString() === targetUserId) return true;

  const member = await User.exists({
    _id: targetUserId,
    workspaceId,
  });
  return Boolean(member);
}

/**
 * Returns all users belonging to workspaceId (its Super User owner + its members).
 */
export async function getWorkspaceUsers(workspaceId: string) {
  await connectDB();
  const ws = await Workspace.findById(workspaceId).select("ownerId").lean();
  if (!ws) return [];

  const users = await User.find({
    $or: [{ _id: ws.ownerId }, { workspaceId }],
  })
    .select("_id name email role workspaceId createdAt")
    .sort({ role: -1, name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(users)) as {
    _id: string;
    name: string;
    email: string;
    role: string;
    workspaceId?: string | null;
    createdAt?: string;
  }[];
}

/**
 * Checks whether `viewerId` is the asset owner or shares at least one Workspace
 * with `ownerId` (used for serving private uploaded assets across shared notes).
 */
export async function canAccessUserAsset(
  viewerId: string,
  ownerId: string,
): Promise<boolean> {
  if (viewerId === ownerId) return true;
  await connectDB();

  const [viewer, owner] = await Promise.all([
    User.findById(viewerId).select("_id role workspaceId").lean(),
    User.findById(ownerId).select("_id role workspaceId").lean(),
  ]);
  if (!viewer || !owner) return false;

  // Check if viewer owns a workspace that owner belongs to (or vice versa)
  if (owner.workspaceId) {
    const ownerWs = await Workspace.findById(owner.workspaceId)
      .select("ownerId")
      .lean();
    if (
      ownerWs &&
      (ownerWs.ownerId.toString() === viewerId ||
        viewer.workspaceId?.toString() === owner.workspaceId.toString())
    ) {
      return true;
    }
  }

  if (viewer.workspaceId) {
    const viewerWs = await Workspace.findById(viewer.workspaceId)
      .select("ownerId")
      .lean();
    if (viewerWs && viewerWs.ownerId.toString() === ownerId) {
      return true;
    }
  }

  return false;
}

