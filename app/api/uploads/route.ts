import { verifyActiveAuth } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { detectImageMagicBytes } from "@/lib/security/upload-validation";
import { storeUploadedImage } from "@/lib/storage/upload";
import UploadedAsset from "@/models/UploadedAsset";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const session = await verifyActiveAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit({
      key: `upload:${session.id}`,
      limit: 40,
      windowMs: 5 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please wait a moment." },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size must be between 1 byte and 10 MB" },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const verifiedImage = detectImageMagicBytes(bytes);
    if (!verifiedImage) {
      return NextResponse.json(
        {
          error:
            "Unsupported or corrupted image file (allowed: PNG, JPG, WEBP, GIF)",
        },
        { status: 400 },
      );
    }

    const filename = `${Date.now()}-${crypto.randomUUID()}.${verifiedImage.ext}`;

    const stored = await storeUploadedImage({
      userId: session.id,
      filename,
      bytes,
      contentType: verifiedImage.mimeType,
    });

    if (stored.storage === "local") {
      await connectDB();
      await UploadedAsset.create({
        filename,
        userId: session.id,
        storage: "local",
      });
    }

    return NextResponse.json(stored);
  } catch (error) {
    console.error("POST /api/uploads error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 },
    );
  }
}
