import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import { getWorkspaceContext, getWorkspaceUsers } from "@/lib/workspace";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json([]);
    }

    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const workspaceUsers = await getWorkspaceUsers(ctx.activeWorkspace._id);

    const filtered = q
      ? workspaceUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q),
        )
      : workspaceUsers;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("GET /api/users/search error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
