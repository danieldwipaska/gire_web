import connectDB from "@/lib/mongodb";
import PullRequest from "@/models/PullRequest";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const pulls = await PullRequest.find({
      updatedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
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
