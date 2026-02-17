import connectDB from "@/lib/mongodb";
import Integration from "@/models/Integration";
import PullRequest from "@/models/PullRequest";
import { NextRequest, NextResponse } from "next/server";

import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const githubIntegration = await Integration.findOne({
      userId: session.id,
      type: "github",
    });

    if (!githubIntegration) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404, statusText: "NOT FOUND" },
      );
    }

    const pulls = await PullRequest.find({
      updatedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      userId: githubIntegration.userId,
      author: githubIntegration.githubUsername,
    }).sort("-updatedAt").limit(1000).lean();

    return NextResponse.json(pulls, { status: 200, statusText: "OK" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" },
    );
  }
}
