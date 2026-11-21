import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select("_id name email")
      .sort({ name: 1 })
      .limit(50)
      .lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/users/search error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

