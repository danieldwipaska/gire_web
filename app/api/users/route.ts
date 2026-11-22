import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct user creation is disabled. Register as a Super User at /api/auth/register or create Workspace members at /api/workspaces/members.",
    },
    { status: 403 },
  );
}
