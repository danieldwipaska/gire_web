import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

declare global {
  var __gireDevJwtKey: Uint8Array | undefined;
}

function getJwtKey(): Uint8Array {
  const envSecret = process.env.JWT_SECRET?.trim() || "";
  if (process.env.NODE_ENV === "production") {
    if (
      !envSecret ||
      envSecret.length < 16 ||
      envSecret === "your-secret-key"
    ) {
      throw new Error(
        "A strong JWT_SECRET environment variable (minimum 16 characters) is required in production.",
      );
    }
    return new TextEncoder().encode(envSecret);
  }

  if (envSecret) {
    return new TextEncoder().encode(envSecret);
  }

  // Non-production ephemeral fallback when JWT_SECRET is unset (never hardcoded)
  if (!globalThis.__gireDevJwtKey) {
    const randomBytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(randomBytes);
    globalThis.__gireDevJwtKey = randomBytes;
  }
  return globalThis.__gireDevJwtKey;
}

export const WORKSPACE_COOKIE_NAME = "gire_workspace";

export const isSuperUserRole = (role?: string | null): boolean => {
  return role !== "member";
};

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  tv?: number;
  [key: string]: unknown;
}

export async function signToken(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getJwtKey());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.id !== "string") {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}
