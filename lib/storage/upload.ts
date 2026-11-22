import { mkdir, writeFile } from "fs/promises";
import path from "path";
import connectDB from "@/lib/mongodb";
import { IStorageIntegration, StorageProviderType } from "@/lib/types";
import StorageIntegration from "@/models/StorageIntegration";
import {
  downloadFromGcp,
  downloadFromR2,
  uploadToGcp,
  uploadToR2,
} from "./providers";

export interface StorageIntegrationDoc {
  _id: { toString(): string } | string;
  userId: { toString(): string } | string;
  provider: StorageProviderType;
  isActive: boolean;
  bucket: string;
  prefix?: string;
  publicUrl?: string;
  r2AccountId?: string;
  r2Endpoint?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  gcpProjectId?: string;
  gcpClientEmail?: string;
  gcpPrivateKey?: string;
  status: "active" | "error";
  lastError?: string;
  lastTestedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

function maskKey(val?: string): string {
  if (!val) return "";
  if (val.length <= 8) return "••••";
  return `${val.slice(0, 4)}••••${val.slice(-4)}`;
}

export function sanitizeStorageIntegration(
  doc: StorageIntegrationDoc,
): IStorageIntegration {
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    provider: doc.provider,
    isActive: Boolean(doc.isActive),
    bucket: doc.bucket,
    prefix: doc.prefix || "notes",
    publicUrl: doc.publicUrl || "",
    r2AccountId: doc.r2AccountId || "",
    r2Endpoint: doc.r2Endpoint || "",
    r2AccessKeyIdMasked: maskKey(doc.r2AccessKeyId),
    hasSecret:
      doc.provider === "cloudflare_r2"
        ? Boolean(doc.r2SecretAccessKey)
        : Boolean(doc.gcpPrivateKey),
    gcpProjectId: doc.gcpProjectId || "",
    gcpClientEmail: doc.gcpClientEmail || "",
    status: doc.status || "active",
    lastError: doc.lastError || "",
    lastTestedAt: doc.lastTestedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function buildObjectKey(prefix: string | undefined, filename: string): string {
  const cleanPrefix = (prefix || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.\./g, "");
  return cleanPrefix ? `${cleanPrefix}/${filename}` : filename;
}

export function buildStoredImageUrl(params: {
  integrationId: string;
  objectKey: string;
  publicUrl?: string;
}): string {
  const base = (params.publicUrl || "").trim().replace(/\/+$/, "");
  if (base) {
    return `${base}/${params.objectKey}`;
  }
  const encodedKey = params.objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/api/uploads/cloud/${params.integrationId}/${encodedKey}`;
}

export async function getActiveStorageIntegration(
  userId: string,
): Promise<StorageIntegrationDoc | null> {
  await connectDB();
  const doc = (await StorageIntegration.findOne({
    userId,
    isActive: true,
  }).lean()) as StorageIntegrationDoc | null;
  return doc;
}

export async function storeUploadedImage(params: {
  userId: string;
  filename: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<{
  url: string;
  filename: string;
  storage: "local" | StorageProviderType;
}> {
  const { userId, filename, bytes, contentType } = params;
  const active = await getActiveStorageIntegration(userId);

  // Fallback to local VPS filesystem when neither Cloudflare R2 nor GCP is active
  if (!active) {
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const targetPath = path.join(uploadsDir, filename);
    await writeFile(targetPath, bytes);
    return {
      url: `/api/uploads/${filename}`,
      filename,
      storage: "local",
    };
  }

  const objectKey = buildObjectKey(active.prefix, filename);

  if (active.provider === "cloudflare_r2") {
    await uploadToR2(
      {
        accountId: active.r2AccountId,
        endpoint: active.r2Endpoint,
        accessKeyId: active.r2AccessKeyId || "",
        secretAccessKey: active.r2SecretAccessKey || "",
        bucket: active.bucket,
      },
      objectKey,
      bytes,
      contentType,
    );
  } else if (active.provider === "gcp_gcs") {
    await uploadToGcp(
      {
        bucket: active.bucket,
        projectId: active.gcpProjectId,
        clientEmail: active.gcpClientEmail || "",
        privateKey: active.gcpPrivateKey || "",
      },
      objectKey,
      bytes,
      contentType,
    );
  }

  return {
    url: buildStoredImageUrl({
      integrationId: active._id.toString(),
      objectKey,
      publicUrl: active.publicUrl,
    }),
    filename,
    storage: active.provider,
  };
}

export async function readCloudUploadedImage(
  doc: StorageIntegrationDoc,
  objectKey: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (doc.provider === "cloudflare_r2") {
    return downloadFromR2(
      {
        accountId: doc.r2AccountId,
        endpoint: doc.r2Endpoint,
        accessKeyId: doc.r2AccessKeyId || "",
        secretAccessKey: doc.r2SecretAccessKey || "",
        bucket: doc.bucket,
      },
      objectKey,
    );
  }
  return downloadFromGcp(
    {
      bucket: doc.bucket,
      projectId: doc.gcpProjectId,
      clientEmail: doc.gcpClientEmail || "",
      privateKey: doc.gcpPrivateKey || "",
    },
    objectKey,
  );
}

