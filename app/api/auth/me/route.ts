import { NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth-server";

export async function GET() {
  const session = await getActiveSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: session });
}
