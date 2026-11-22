import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { signToken, WORKSPACE_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit({
      key: `register-ip:${ip}`,
      limit: 15,
      windowMs: 60 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!name || name.length > 100 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Valid name and email are required" },
        { status: 400 },
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { message: "Password must be between 6 and 128 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Public registration always creates a Super User account
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "super_user",
      workspaceId: null,
      activeWorkspaceId: null,
      tokenVersion: 0,
    });

    const token = await signToken({
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      tv: 0,
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    cookieStore.delete(WORKSPACE_COOKIE_NAME);

    return NextResponse.json(
      {
        message: "Super User created successfully",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        requiresWorkspaceSetup: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
