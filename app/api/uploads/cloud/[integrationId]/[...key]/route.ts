import { verifyActiveAuth } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import {
  readCloudUploadedImage,
  StorageIntegrationDoc,
} from "@/lib/storage/upload";
import { canAccessUserAsset } from "@/lib/workspace";
import StorageIntegration from "@/models/StorageIntegration";
import mongoose from "mongoose";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const EXT_CONTENT_TYPE: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ integrationId: string; key: string[] }> },
) {
  try {
    const session = await verifyActiveAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { integrationId, key } = await params;
    if (!mongoose.Types.ObjectId.isValid(integrationId) || !key?.length) {
      return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
    }

    const decodedSegments = key.map((seg) => decodeURIComponent(seg));
    if (
      decodedSegments.some(
        (seg) => !seg || seg === "." || seg === ".." || seg.includes("\\"),
      )
    ) {
      return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
    }

    const objectKey = decodedSegments.join("/");
    const ext = path.extname(objectKey).toLowerCase();
    const fallbackType = EXT_CONTENT_TYPE[ext];
    if (!fallbackType) {
      return NextResponse.json({ error: "Unsupported file" }, { status: 400 });
    }

    await connectDB();

    const integration = (await StorageIntegration.findById(
      integrationId,
    ).lean()) as StorageIntegrationDoc | null;
    if (!integration) {
      return NextResponse.json(
        { error: "Storage integration not found" },
        { status: 404 },
      );
    }

    const allowed = await canAccessUserAsset(
      session.id,
      integration.userId.toString(),
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const obj = await readCloudUploadedImage(integration, objectKey);
    if (!obj) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(obj.buffer), {
      status: 200,
      headers: {
        "Content-Type": obj.contentType || fallbackType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    console.error("GET /api/uploads/cloud error:", error);
    return NextResponse.json(
      { error: "Failed to load image" },
      { status: 500 },
    );
  }
}

