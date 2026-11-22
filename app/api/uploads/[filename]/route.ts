import { verifyActiveAuth } from "@/lib/auth-server";
import connectDB from "@/lib/mongodb";
import { canAccessUserAsset } from "@/lib/workspace";
import UploadedAsset from "@/models/UploadedAsset";
import { readFile } from "fs/promises";
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
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const session = await verifyActiveAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;
    const safeName = path.basename(filename);

    if (!/^[a-zA-Z0-9._-]+$/.test(safeName)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const ext = path.extname(safeName).toLowerCase();
    const contentType = EXT_CONTENT_TYPE[ext];
    if (!contentType) {
      return NextResponse.json({ error: "Unsupported file" }, { status: 400 });
    }

    await connectDB();
    const asset = (await UploadedAsset.findOne({ filename: safeName })
      .select("userId")
      .lean()) as { userId: { toString(): string } } | null;

    if (asset) {
      const allowed = await canAccessUserAsset(
        session.id,
        asset.userId.toString(),
      );
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const filePath = path.join(process.cwd(), "uploads", safeName);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
