import { verifyAuth } from "@/lib/auth";
import { storeUploadedImage } from "@/lib/storage/upload";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    const ext = ALLOWED_MIME_EXT[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported image format (use PNG, JPG, WEBP, or GIF)" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size exceeds 10 MB limit" },
        { status: 400 },
      );
    }

    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const stored = await storeUploadedImage({
      userId: session.id,
      filename,
      bytes,
      contentType: file.type,
    });

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

