import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import {
  buildR2Endpoint,
  parseGcpServiceAccountJson,
  testGcpConnection,
  testR2Connection,
} from "@/lib/storage/providers";
import {
  sanitizeStorageIntegration,
  StorageIntegrationDoc,
} from "@/lib/storage/upload";
import { StorageProviderType } from "@/lib/types";
import StorageIntegration from "@/models/StorageIntegration";
import { NextRequest, NextResponse } from "next/server";

const VALID_PROVIDERS: StorageProviderType[] = ["cloudflare_r2", "gcp_gcs"];

export async function GET(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const docs = (await StorageIntegration.find({
      userId: session.id,
    }).lean()) as unknown as StorageIntegrationDoc[];

    const integrations = docs.map(sanitizeStorageIntegration);
    const active = integrations.find((i) => i.isActive);

    return NextResponse.json({
      integrations,
      activeProvider: active ? active.provider : "local",
    });
  } catch (error) {
    console.error("GET /api/storage-integrations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage integrations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const body = (await req.json()) as {
      provider?: StorageProviderType;
      bucket?: string;
      prefix?: string;
      publicUrl?: string;
      activate?: boolean;
      r2AccountId?: string;
      r2Endpoint?: string;
      r2AccessKeyId?: string;
      r2SecretAccessKey?: string;
      gcpServiceAccountJson?: string;
    };

    const { provider } = body;
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid storage provider" },
        { status: 400 },
      );
    }

    const bucket = (body.bucket || "").trim();
    if (!bucket) {
      return NextResponse.json(
        { error: "Bucket name is required" },
        { status: 400 },
      );
    }

    const prefix = (body.prefix ?? "notes")
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.\./g, "");
    const publicUrl = (body.publicUrl || "").trim().replace(/\/+$/, "");
    if (publicUrl && !/^https?:\/\//i.test(publicUrl)) {
      return NextResponse.json(
        { error: "Public Base URL must start with http:// or https://" },
        { status: 400 },
      );
    }

    const existing = (await StorageIntegration.findOne({
      userId: session.id,
      provider,
    }).lean()) as StorageIntegrationDoc | null;

    const shouldActivate = body.activate !== false;

    if (provider === "cloudflare_r2") {
      const r2AccountId = (body.r2AccountId || "").trim();
      const r2Endpoint = buildR2Endpoint(r2AccountId, body.r2Endpoint);
      const r2AccessKeyId = (
        body.r2AccessKeyId ||
        existing?.r2AccessKeyId ||
        ""
      ).trim();
      const r2SecretAccessKey = (
        body.r2SecretAccessKey ||
        existing?.r2SecretAccessKey ||
        ""
      ).trim();

      if (!r2AccessKeyId || !r2SecretAccessKey) {
        return NextResponse.json(
          { error: "R2 Access Key ID and Secret Access Key are required" },
          { status: 400 },
        );
      }

      try {
        await testR2Connection({
          accountId: r2AccountId,
          endpoint: r2Endpoint,
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
          bucket,
        });
      } catch (connErr) {
        return NextResponse.json(
          {
            error:
              connErr instanceof Error
                ? connErr.message
                : "Cloudflare R2 connection check failed",
          },
          { status: 400 },
        );
      }

      if (shouldActivate) {
        await StorageIntegration.updateMany(
          { userId: session.id, provider: { $ne: provider } },
          { isActive: false },
        );
      }

      const saved = (await StorageIntegration.findOneAndUpdate(
        { userId: session.id, provider },
        {
          userId: session.id,
          provider,
          isActive: shouldActivate ? true : Boolean(existing?.isActive),
          bucket,
          prefix,
          publicUrl,
          r2AccountId,
          r2Endpoint,
          r2AccessKeyId,
          r2SecretAccessKey,
          status: "active",
          lastError: "",
          lastTestedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean()) as StorageIntegrationDoc;

      return NextResponse.json({
        integration: sanitizeStorageIntegration(saved),
      });
    }

    // GCP Cloud Storage
    let gcpProjectId = existing?.gcpProjectId || "";
    let gcpClientEmail = existing?.gcpClientEmail || "";
    let gcpPrivateKey = existing?.gcpPrivateKey || "";

    if (body.gcpServiceAccountJson?.trim()) {
      let parsed;
      try {
        parsed = parseGcpServiceAccountJson(body.gcpServiceAccountJson);
      } catch (parseErr) {
        return NextResponse.json(
          {
            error:
              parseErr instanceof Error
                ? parseErr.message
                : "Invalid Service Account JSON",
          },
          { status: 400 },
        );
      }
      gcpProjectId = parsed.projectId;
      gcpClientEmail = parsed.clientEmail;
      gcpPrivateKey = parsed.privateKey;
    }

    if (!gcpClientEmail || !gcpPrivateKey) {
      return NextResponse.json(
        { error: "GCP Service Account JSON is required" },
        { status: 400 },
      );
    }

    try {
      await testGcpConnection({
        bucket,
        projectId: gcpProjectId,
        clientEmail: gcpClientEmail,
        privateKey: gcpPrivateKey,
      });
    } catch (connErr) {
      return NextResponse.json(
        {
          error:
            connErr instanceof Error
              ? connErr.message
              : "GCP Cloud Storage connection check failed",
        },
        { status: 400 },
      );
    }

    if (shouldActivate) {
      await StorageIntegration.updateMany(
        { userId: session.id, provider: { $ne: provider } },
        { isActive: false },
      );
    }

    const saved = (await StorageIntegration.findOneAndUpdate(
      { userId: session.id, provider },
      {
        userId: session.id,
        provider,
        isActive: shouldActivate ? true : Boolean(existing?.isActive),
        bucket,
        prefix,
        publicUrl,
        gcpProjectId,
        gcpClientEmail,
        gcpPrivateKey,
        status: "active",
        lastError: "",
        lastTestedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean()) as StorageIntegrationDoc;

    return NextResponse.json({
      integration: sanitizeStorageIntegration(saved),
    });
  } catch (error) {
    console.error("POST /api/storage-integrations error:", error);
    return NextResponse.json(
      { error: "Failed to save storage integration" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const body = (await req.json()) as {
      provider?: "local" | StorageProviderType;
    };

    const provider = body.provider;
    if (
      provider !== "local" &&
      (!provider || !VALID_PROVIDERS.includes(provider))
    ) {
      return NextResponse.json(
        { error: "Invalid storage provider" },
        { status: 400 },
      );
    }

    if (provider === "local") {
      await StorageIntegration.updateMany(
        { userId: session.id },
        { isActive: false },
      );
      return NextResponse.json({ activeProvider: "local" });
    }

    const target = await StorageIntegration.findOne({
      userId: session.id,
      provider,
    });
    if (!target) {
      return NextResponse.json(
        { error: "Storage integration is not configured yet" },
        { status: 404 },
      );
    }

    await StorageIntegration.updateMany(
      { userId: session.id },
      { isActive: false },
    );
    target.isActive = true;
    await target.save();

    return NextResponse.json({
      activeProvider: provider,
      integration: sanitizeStorageIntegration(
        target.toObject() as StorageIntegrationDoc,
      ),
    });
  } catch (error) {
    console.error("PATCH /api/storage-integrations error:", error);
    return NextResponse.json(
      { error: "Failed to switch storage provider" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  try {
    const { provider } = (await req.json()) as {
      provider?: StorageProviderType;
    };
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid storage provider" },
        { status: 400 },
      );
    }

    const result = await StorageIntegration.deleteOne({
      userId: session.id,
      provider,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Storage integration not found" },
        { status: 404 },
      );
    }

    const remainingActive = await StorageIntegration.findOne({
      userId: session.id,
      isActive: true,
    }).lean();

    return NextResponse.json({
      message: "Storage integration removed",
      activeProvider: remainingActive
        ? (remainingActive as unknown as StorageIntegrationDoc).provider
        : "local",
    });
  } catch (error) {
    console.error("DELETE /api/storage-integrations error:", error);
    return NextResponse.json(
      { error: "Failed to remove storage integration" },
      { status: 500 },
    );
  }
}

