import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (session?.id) {
      await connectDB();
      await User.findByIdAndUpdate(session.id, { $inc: { tokenVersion: 1 } });
    }
  } catch (error) {
    console.error("Logout token revocation warning:", error);
  }

  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete(WORKSPACE_COOKIE_NAME);

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 },
  );
}
