import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { signToken, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { getWorkspaceContext } from "@/lib/workspace";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password || password.length > 128) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 },
      );
    }

    const ip = getClientIp(req);
    const ipLimit = checkRateLimit({
      key: `login-ip:${ip}`,
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
    const acctLimit = checkRateLimit({
      key: `login-acct:${ip}:${email}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!ipLimit.allowed || !acctLimit.allowed) {
      const retryAfter = Math.max(
        ipLimit.retryAfterSeconds,
        acctLimit.retryAfterSeconds,
      );
      return NextResponse.json(
        { message: "Too many login attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    });

    const ctx = await getWorkspaceContext(user._id.toString());

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    if (ctx?.activeWorkspace) {
      cookieStore.set(WORKSPACE_COOKIE_NAME, ctx.activeWorkspace._id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    } else {
      cookieStore.delete(WORKSPACE_COOKIE_NAME);
    }

    return NextResponse.json(
      {
        message: "Login successful",
        hasWorkspace: Boolean(ctx?.activeWorkspace),
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
