import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockVerifyAuth = vi.fn();
const mockGetWorkspaceContext = vi.fn();
const mockIsUserInWorkspace = vi.fn();
const mockGetWorkspaceUsers = vi.fn();

const mockConnectDB = vi.fn();
const mockWorkspaceCreate = vi.fn();
const mockUserFindByIdAndUpdate = vi.fn();
const mockUserFindOne = vi.fn();
const mockUserFindById = vi.fn();
const mockUserCreate = vi.fn();
const mockUserDeleteOne = vi.fn();
const mockProjectExists = vi.fn();
const mockNoteExists = vi.fn();
const mockNoteUpdateOne = vi.fn();
const mockTaskCreate = vi.fn();
const mockCookieSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mockCookieSet,
    delete: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    verifyAuth: mockVerifyAuth,
  };
});

vi.mock("@/lib/mongodb", () => ({
  default: mockConnectDB,
}));

vi.mock("@/lib/workspace", () => ({
  getWorkspaceContext: mockGetWorkspaceContext,
  isUserInWorkspace: mockIsUserInWorkspace,
  getWorkspaceUsers: mockGetWorkspaceUsers,
}));

vi.mock("@/models/Workspace", () => ({
  default: {
    create: mockWorkspaceCreate,
  },
}));

vi.mock("@/models/User", () => ({
  default: {
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
    findOne: mockUserFindOne,
    findById: mockUserFindById,
    create: mockUserCreate,
    deleteOne: mockUserDeleteOne,
  },
}));

vi.mock("@/models/Project", () => ({
  default: {
    exists: mockProjectExists,
    updateMany: vi.fn(),
  },
}));

vi.mock("@/models/Note", () => ({
  default: {
    exists: mockNoteExists,
    updateOne: mockNoteUpdateOne,
    updateMany: vi.fn(),
  },
}));

vi.mock("@/models/Task", () => ({
  default: {
    create: mockTaskCreate,
  },
}));

describe("multi-tenant Workspace & RBAC isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows Super User to create multiple Workspaces but blocks Members (403)", async () => {
    const { POST } = await import("@/app/api/workspaces/route");

    mockVerifyAuth.mockResolvedValue({ id: "member-1", role: "member" });
    mockGetWorkspaceContext.mockResolvedValue({
      userId: "member-1",
      isSuperUser: false,
      workspaces: [{ _id: "ws-1", name: "Acme", ownerId: "super-1" }],
      activeWorkspace: { _id: "ws-1", name: "Acme", ownerId: "super-1" },
    });

    const memberReq = new NextRequest("http://localhost/api/workspaces", {
      method: "POST",
      body: JSON.stringify({ name: "Rogue Workspace" }),
    });
    const memberRes = await POST(memberReq);
    expect(memberRes.status).toBe(403);
    expect(mockWorkspaceCreate).not.toHaveBeenCalled();

    // Super User succeeds
    mockVerifyAuth.mockResolvedValue({ id: "super-1", role: "super_user" });
    mockGetWorkspaceContext.mockResolvedValue({
      userId: "super-1",
      isSuperUser: true,
      workspaces: [{ _id: "ws-1", name: "Office", ownerId: "super-1" }],
      activeWorkspace: { _id: "ws-1", name: "Office", ownerId: "super-1" },
    });
    mockWorkspaceCreate.mockResolvedValue({
      _id: "ws-2",
      name: "Freelance",
      ownerId: "super-1",
    });

    const superReq = new NextRequest("http://localhost/api/workspaces", {
      method: "POST",
      body: JSON.stringify({ name: "Freelance" }),
    });
    const superRes = await POST(superReq);
    expect(superRes.status).toBe(201);
    expect(mockWorkspaceCreate).toHaveBeenCalledWith({
      name: "Freelance",
      description: "",
      ownerId: "super-1",
    });
  });

  it("restricts member creation to Super User within their own Workspace and enforces 1 Workspace per Member", async () => {
    const { POST } = await import("@/app/api/workspaces/members/route");

    // 1. Member cannot create users
    mockVerifyAuth.mockResolvedValue({ id: "member-1", role: "member" });
    mockGetWorkspaceContext.mockResolvedValue({
      userId: "member-1",
      isSuperUser: false,
      workspaces: [{ _id: "ws-1", name: "Acme", ownerId: "super-1" }],
      activeWorkspace: { _id: "ws-1", name: "Acme", ownerId: "super-1" },
    });
    const res1 = await POST(
      new NextRequest("http://localhost/api/workspaces/members", {
        method: "POST",
        body: JSON.stringify({
          name: "New",
          email: "new@acme.com",
          password: "password123",
        }),
      }),
    );
    expect(res1.status).toBe(403);

    // 2. Super User cannot create member in another Super User's Workspace
    mockVerifyAuth.mockResolvedValue({ id: "super-1", role: "super_user" });
    mockGetWorkspaceContext.mockResolvedValue({
      userId: "super-1",
      isSuperUser: true,
      workspaces: [{ _id: "ws-1", name: "Acme", ownerId: "super-1" }],
      activeWorkspace: { _id: "ws-1", name: "Acme", ownerId: "super-1" },
    });
    const res2 = await POST(
      new NextRequest("http://localhost/api/workspaces/members", {
        method: "POST",
        body: JSON.stringify({
          name: "New",
          email: "new@other.com",
          password: "password123",
          workspaceId: "ws-other",
        }),
      }),
    );
    expect(res2.status).toBe(403);

    // 3. Duplicate email rejected (regular user can only belong to 1 Workspace)
    mockUserFindOne.mockReturnValue({
      select: () => ({ lean: async () => ({ _id: "existing-user" }) }),
    });
    const res3 = await POST(
      new NextRequest("http://localhost/api/workspaces/members", {
        method: "POST",
        body: JSON.stringify({
          name: "Dup",
          email: "existing@acme.com",
          password: "password123",
        }),
      }),
    );
    expect(res3.status).toBe(400);
  });

  it("enforces Super User only & same-Workspace restriction on task delegation", async () => {
    const { POST } = await import("@/app/api/tasks/route");

    // 1. Member cannot delegate tasks
    mockVerifyAuth.mockResolvedValue({ id: "member-1", role: "member" });
    mockGetWorkspaceContext.mockResolvedValue({
      userId: "member-1",
      isSuperUser: false,
      workspaces: [{ _id: "ws-1", name: "Acme", ownerId: "super-1" }],
      activeWorkspace: { _id: "ws-1", name: "Acme", ownerId: "super-1" },
    });

    const memberRes = await POST(
      new NextRequest("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Do work",
          assignedTo: "507f1f77bcf86cd799439011",
        }),
      }),
    );
    expect(memberRes.status).toBe(403);

    // 2. Super User cannot delegate to a user outside active Workspace
    mockVerifyAuth.mockResolvedValue({ id: "super-1", role: "super_user" });
    mockGetWorkspaceContext.mockResolvedValue({
      userId: "super-1",
      isSuperUser: true,
      workspaces: [{ _id: "ws-1", name: "Acme", ownerId: "super-1" }],
      activeWorkspace: { _id: "ws-1", name: "Acme", ownerId: "super-1" },
    });
    mockUserFindById.mockReturnValue({
      select: async () => ({ _id: "507f1f77bcf86cd799439099" }),
    });
    mockIsUserInWorkspace.mockResolvedValue(false);

    const crossWsRes = await POST(
      new NextRequest("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Leak task",
          assignedTo: "507f1f77bcf86cd799439099",
        }),
      }),
    );
    expect(crossWsRes.status).toBe(403);
    expect(mockTaskCreate).not.toHaveBeenCalled();

    // 3. Super User successfully delegates to same-Workspace member and auto-shares source Note
    mockIsUserInWorkspace.mockResolvedValue(true);
    mockNoteExists.mockResolvedValue(true);
    mockTaskCreate.mockResolvedValue({
      _id: "task-1",
      title: "Build API",
      assignedTo: "507f1f77bcf86cd799439011",
      workspaceId: "ws-1",
      sourceNoteId: "507f1f77bcf86cd799439022",
    });

    const validRes = await POST(
      new NextRequest("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Build API",
          assignedTo: "507f1f77bcf86cd799439011",
          sourceNoteId: "507f1f77bcf86cd799439022",
        }),
      }),
    );
    expect(validRes.status).toBe(201);
    expect(mockNoteUpdateOne).toHaveBeenCalled();
  });
});

