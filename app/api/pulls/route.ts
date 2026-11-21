import connectDB from "@/lib/mongodb";
import Integration from "@/models/Integration";
import PullRequest from "@/models/PullRequest";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { IPullRequest } from "@/lib/types";
import { isSameUser } from "@/lib/utils";

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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rawPulls: IPullRequest[] = await PullRequest.find({
      userId: githubIntegration.userId,
      $or: [
        { updatedAt: { $gte: thirtyDaysAgo } },
        { githubCreatedAt: { $gte: thirtyDaysAgo } },
      ],
    })
      .sort("-updatedAt")
      .limit(1000)
      .lean();

    const pulls = rawPulls.filter((pr) =>
      isSameUser(pr.author, githubIntegration.githubUsername),
    );

    return NextResponse.json(pulls, { status: 200, statusText: "OK" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" },
    );
  }
}
