import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { isValidFigmaUrl } from "@/lib/utils";
import { getWorkspaceContext } from "@/lib/workspace";
import Project from "@/models/Project";
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

    await connectDB();

    const projects = await Project.find({
      workspaceId: ctx.activeWorkspace._id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieWs = req.cookies.get(WORKSPACE_COOKIE_NAME)?.value;
    const ctx = await getWorkspaceContext(session.id, cookieWs);
    if (!ctx || !ctx.activeWorkspace) {
      return NextResponse.json(
        { error: "Please create a Workspace first" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    const category =
      body?.category === "freelance" || body?.category === "personal"
        ? body.category
        : "office";

    const repos: string[] = Array.isArray(body?.repos)
      ? Array.from(
          new Set(
            body.repos
              .map((r: unknown) => (typeof r === "string" ? r.trim() : ""))
              .filter(Boolean),
          ),
        )
      : [];

    const figmaLinks: { title: string; url: string; kind: "design" | "prototype" }[] = [];
    if (Array.isArray(body?.figmaLinks)) {
      for (const link of body.figmaLinks) {
        const url = typeof link?.url === "string" ? link.url.trim() : "";
        if (!url) continue;
        if (!isValidFigmaUrl(url)) {
          return NextResponse.json(
            { error: `Invalid Figma URL: ${url}` },
            { status: 400 },
          );
        }
        figmaLinks.push({
          title:
            typeof link?.title === "string" && link.title.trim()
              ? link.title.trim()
              : "Figma Design",
          url,
          kind: link?.kind === "prototype" ? "prototype" : "design",
        });
      }
    }

    await connectDB();

    const project = await Project.create({
      name,
      description:
        typeof body?.description === "string" ? body.description.trim() : "",
      category,
      clientOrTeam:
        typeof body?.clientOrTeam === "string" ? body.clientOrTeam.trim() : "",
      status: "active",
      color: typeof body?.color === "string" ? body.color : "indigo",
      workspaceId: ctx.activeWorkspace._id,
      ownerId: session.id,
      members: [{ userId: session.id, role: "owner" }],
      repos,
      figmaLinks,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
