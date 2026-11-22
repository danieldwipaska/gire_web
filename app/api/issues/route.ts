import connectDB from "@/lib/mongodb";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import { NextRequest, NextResponse } from "next/server";
import { verifyActiveAuth } from "@/lib/auth-server";
import { IIssue } from "@/lib/types";
import { isIssueAssignedTo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyActiveAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const githubIntegrations = await Integration.find({
      userId: session.id,
      provider: "github",
    }).lean();

    if (githubIntegrations.length === 0) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404, statusText: "NOT FOUND" },
      );
    }

    const usernames = githubIntegrations
      .map((i) => i.githubUsername)
      .filter(Boolean);

    const rawIssues: IIssue[] = await Issue.find({
      userId: session.id,
      state: "open",
    })
      .sort("-updatedAt")
      .limit(1000)
      .lean();

    const issues = rawIssues.filter((issue) =>
      isIssueAssignedTo(issue, usernames),
    );

    return NextResponse.json(issues, { status: 200, statusText: "OK" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" },
    );
  }
}
