import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  buildR2Endpoint,
  encodeS3Path,
  parseGcpServiceAccountJson,
  signR2Request,
} from "@/lib/storage/providers";
import { buildObjectKey, buildStoredImageUrl } from "@/lib/storage/upload";

const {
  mockVerifyAuth,
  mockConnectDB,
  mockFindOne,
  mockFind,
  mockUpdateMany,
  mockFindOneAndUpdate,
  mockDeleteOne,
  mockMkdir,
  mockWriteFile,
} = vi.hoisted(() => ({
  mockVerifyAuth: vi.fn(),
  mockConnectDB: vi.fn(),
  mockFindOne: vi.fn(),
  mockFind: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockFindOneAndUpdate: vi.fn(),
  mockDeleteOne: vi.fn(),
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

vi.mock("@/lib/auth", () => ({
  verifyAuth: mockVerifyAuth,
}));

vi.mock("@/lib/mongodb", () => ({
  default: mockConnectDB,
}));

vi.mock("@/models/StorageIntegration", () => ({
  default: {
    findOne: mockFindOne,
    find: mockFind,
    updateMany: mockUpdateMany,
    findOneAndUpdate: mockFindOneAndUpdate,
    deleteOne: mockDeleteOne,
  },
}));

describe("Cloudflare R2 & GCP Storage helpers", () => {
  it("builds and encodes R2 endpoints & S3 paths cleanly", () => {
    expect(buildR2Endpoint("acct123")).toBe(
      "https://acct123.r2.cloudflarestorage.com",
    );
    expect(buildR2Endpoint("", "https://custom.r2.dev/")).toBe(
      "https://custom.r2.dev",
    );
    expect(() => buildR2Endpoint("", "")).toThrow(/required/i);
    expect(encodeS3Path("notes/my screen shot!.png")).toBe(
      "notes/my%20screen%20shot%21.png",
    );
  });

  it("signs R2 requests using AWS4-HMAC-SHA256", () => {
    const signed = signR2Request({
      method: "PUT",
      endpoint: "https://acct123.r2.cloudflarestorage.com",
      bucket: "gire-assets",
      key: "notes/test.png",
      accessKeyId: "AKIAEXAMPLE",
      secretAccessKey: "secret-key",
      payload: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
      now: new Date("2026-11-22T10:00:00.000Z"),
    });

    expect(signed.url).toBe(
      "https://acct123.r2.cloudflarestorage.com/gire-assets/notes/test.png",
    );
    expect(signed.headers["x-amz-date"]).toBe("20261122T100000Z");
    expect(signed.headers.Authorization).toContain(
      "AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE/20261122/auto/s3/aws4_request",
    );
    expect(signed.headers.Authorization).toContain(
      "SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date",
    );
  });

  it("parses and validates GCP Service Account JSON", () => {
    const raw = JSON.stringify({
      project_id: "gire-proj",
      client_email: "sa@gire-proj.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n",
    });

    const parsed = parseGcpServiceAccountJson(raw);
    expect(parsed.projectId).toBe("gire-proj");
    expect(parsed.clientEmail).toBe("sa@gire-proj.iam.gserviceaccount.com");
    expect(parsed.privateKey).toContain("\nABC\n");

    expect(() => parseGcpServiceAccountJson("not-json")).toThrow(/Invalid/i);
    expect(() => parseGcpServiceAccountJson('{"project_id":"x"}')).toThrow(
      /client_email/,
    );
  });

  it("builds object keys and falls back to authenticated proxy URL when publicUrl is empty", () => {
    const key = buildObjectKey("/notes/screenshots/", "img.png");
    expect(key).toBe("notes/screenshots/img.png");

    expect(
      buildStoredImageUrl({
        integrationId: "int-1",
        objectKey: key,
        publicUrl: "https://cdn.example.com/",
      }),
    ).toBe("https://cdn.example.com/notes/screenshots/img.png");

    expect(
      buildStoredImageUrl({
        integrationId: "int-1",
        objectKey: key,
        publicUrl: "",
      }),
    ).toBe("/api/uploads/cloud/int-1/notes/screenshots/img.png");
  });
});

describe("Storage fallback and /api/storage-integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to local server storage when neither R2 nor GCP is active", async () => {
    const { storeUploadedImage } = await import("@/lib/storage/upload");
    mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const res = await storeUploadedImage({
      userId: "user-1",
      filename: "shot.png",
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
    });

    expect(res.storage).toBe("local");
    expect(res.url).toBe("/api/uploads/shot.png");
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
  });

  it("switches to local server storage when PATCH provider='local' is called", async () => {
    const { PATCH } = await import("@/app/api/storage-integrations/route");
    mockVerifyAuth.mockResolvedValue({ id: "user-1", role: "super_user" });
    mockUpdateMany.mockResolvedValue({ modifiedCount: 1 });

    const req = new NextRequest("http://localhost/api/storage-integrations", {
      method: "PATCH",
      body: JSON.stringify({ provider: "local" }),
    });
    const res = await PATCH(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.activeProvider).toBe("local");
    expect(mockUpdateMany).toHaveBeenCalledWith(
      { userId: "user-1" },
      { isActive: false },
    );
  });

  it("rejects invalid provider and missing bucket on POST /api/storage-integrations", async () => {
    const { POST } = await import("@/app/api/storage-integrations/route");
    mockVerifyAuth.mockResolvedValue({ id: "user-1", role: "super_user" });

    const badProviderRes = await POST(
      new NextRequest("http://localhost/api/storage-integrations", {
        method: "POST",
        body: JSON.stringify({ provider: "aws_s3", bucket: "b" }),
      }),
    );
    expect(badProviderRes.status).toBe(400);

    const noBucketRes = await POST(
      new NextRequest("http://localhost/api/storage-integrations", {
        method: "POST",
        body: JSON.stringify({ provider: "cloudflare_r2", bucket: "   " }),
      }),
    );
    expect(noBucketRes.status).toBe(400);
  });
});

