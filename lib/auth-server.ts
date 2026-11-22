import { NextRequest } from "next/server";
import { getSession, SessionPayload, verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

async function confirmActiveUser(
  session: SessionPayload | null,
): Promise<SessionPayload | null> {
  if (!session) return null;
  await connectDB();

  const user = (await User.findById(session.id)
    .select("_id role tokenVersion email name")
    .lean()) as {
    _id: { toString(): string };
    role: string;
    tokenVersion?: number;
    email: string;
    name: string;
  } | null;

  if (!user) return null;

  const currentVersion = user.tokenVersion ?? 0;
  if (typeof session.tv === "number" && session.tv !== currentVersion) {
    return null;
  }

  return {
    ...session,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

/**
 * Verifies both JWT signature and live MongoDB user status / tokenVersion
 * so deleted members or revoked sessions cannot access API routes.
 */
export async function verifyActiveAuth(
  req: NextRequest,
): Promise<SessionPayload | null> {
  const session = await verifyAuth(req);
  return confirmActiveUser(session);
}

export async function getActiveSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  return confirmActiveUser(session);
}

