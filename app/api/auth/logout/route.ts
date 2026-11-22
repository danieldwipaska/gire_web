import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { WORKSPACE_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete(WORKSPACE_COOKIE_NAME);

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 },
  );
}
