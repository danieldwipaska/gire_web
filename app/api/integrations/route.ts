import connectDB from "@/lib/mongodb";
import Integration from "@/models/Integration";
import { NextRequest, NextResponse } from "next/server";
import { verifyActiveAuth } from "@/lib/auth-server";
import { encryptSecret } from "@/lib/security/crypto";
import mongoose from "mongoose";
import { Octokit } from "octokit";

type IntegrationPayload = {
  provider: string | "github";
  label?: string;
  githubUsername?: string;
  accessToken: string;
  lastSync?: string | Date;
  status?: "active" | "expired";
};

export async function POST(req: NextRequest) {
  const session = await verifyActiveAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    await Integration.syncIndexes();

    const {
      provider = "github",
      label = "Personal",
      githubUsername,
      accessToken,
      lastSync,
      status = "active",
    }: IntegrationPayload = await req.json();

    if (!accessToken?.trim()) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 },
      );
    }

    let resolvedUsername = (githubUsername || "").trim();

    if (provider === "github") {
      try {
        const octokit = new Octokit({ auth: accessToken.trim() });
        const { data: ghUser } = await octokit.rest.users.getAuthenticated();
        resolvedUsername = ghUser.login;
      } catch {
        return NextResponse.json(
          { error: "Invalid GitHub Personal Access Token" },
          { status: 400 },
        );
      }
    }

    if (!resolvedUsername) {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 },
      );
    }

    const existing = await Integration.exists({
      provider,
      githubUsername: resolvedUsername,
      userId: session.id,
    });
    if (existing) {
      return NextResponse.json(
        { error: `GitHub account @${resolvedUsername} is already connected` },
        { status: 400, statusText: "BAD REQUEST" },
      );
    }

    const newIntegration = await Integration.create({
      userId: session.id,
      provider,
      label: label.trim() || "Personal",
      githubUsername: resolvedUsername,
      accessToken: encryptSecret(accessToken.trim()),
      lastSync: lastSync ? new Date(lastSync) : undefined,
      status,
    });

    const sanitized = newIntegration.toObject();
    delete sanitized.accessToken;

    return NextResponse.json(sanitized, { status: 200, statusText: "OK" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await verifyActiveAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const integrations = await Integration.find({
      userId: session.id,
      provider: "github",
    })
      .select("-accessToken")
      .lean();

    return NextResponse.json(integrations, { status: 200, statusText: "OK" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await verifyActiveAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const {
      id,
      label,
      accessToken,
    }: { id?: string; label?: string; accessToken?: string } =
      await req.json();

    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid integration id is required" },
        { status: 400 },
      );
    }

    const integration = await Integration.findOne({
      _id: id,
      userId: session.id,
      provider: "github",
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    if (typeof label === "string" && label.trim()) {
      integration.label = label.trim().slice(0, 40);
    }

    if (typeof accessToken === "string" && accessToken.trim()) {
      try {
        const octokit = new Octokit({ auth: accessToken.trim() });
        const { data: ghUser } = await octokit.rest.users.getAuthenticated();
        integration.githubUsername = ghUser.login;
        integration.accessToken = encryptSecret(accessToken.trim());
        integration.status = "active";
      } catch {
        return NextResponse.json(
          { error: "Invalid GitHub Personal Access Token" },
          { status: 400 },
        );
      }
    }

    await integration.save();
    const sanitized = integration.toObject();
    delete sanitized.accessToken;

    return NextResponse.json(sanitized, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/integrations error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyActiveAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const { id } = await req.json();
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid integration id" },
        { status: 400 },
      );
    }

    const result = await Integration.deleteOne({
      _id: id,
      userId: session.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Integration deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
