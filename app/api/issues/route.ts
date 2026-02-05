import connectDB from "@/lib/mongodb";
import Issue from "@/models/Issue";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const issues = await Issue.find().sort("-updatedAt").lean();

    return NextResponse.json(issues, { status: 200, statusText: "OK" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" }
    );
  }
}
