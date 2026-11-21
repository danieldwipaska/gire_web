import connectDB from "@/lib/mongodb";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { IIssue } from "@/lib/types";
import { isIssueAssignedTo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const githubIntegration = await Integration.findOne({
      userId: session.id,
      provider: "github",
    }).lean();

    if (!githubIntegration) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404, statusText: "NOT FOUND" },
      );
    }

    const rawIssues: IIssue[] = await Issue.find({
      userId: githubIntegration.userId,
      state: "open",
    })
      .sort("-updatedAt")
      .limit(1000)
      .lean();

    const issues = rawIssues.filter((issue) =>
      isIssueAssignedTo(issue, githubIntegration.githubUsername),
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
