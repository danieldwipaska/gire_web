import connectDB from "@/lib/mongodb";
import Integration from "@/models/Integration";
import Issue from "@/models/Issue";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const githubIntegration = await Integration.findOne({
      userId: process.env.USER_ID,
      type: "github",
    });

    if (!githubIntegration) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404, statusText: "NOT FOUND" },
      );
    }

    const issues = await Issue.find({
      updatedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      userId: githubIntegration.userId,
      assignee: githubIntegration.githubUsername,
    }).sort("-updatedAt").limit(1000).lean();

    return NextResponse.json(issues, { status: 200, statusText: "OK" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" },
    );
  }
}
