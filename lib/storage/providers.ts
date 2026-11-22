import crypto from "crypto";
import { importPKCS8, SignJWT } from "jose";

export interface R2Config {
  accountId?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface GcpConfig {
  bucket: string;
  projectId?: string;
  clientEmail: string;
  privateKey: string;
}

export interface ParsedGcpServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function sha256Hex(data: string | Uint8Array): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

export function encodeS3Path(pathStr: string): string {
  return pathStr
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join("/");
}

export function buildR2Endpoint(accountId?: string, endpoint?: string): string {
  const custom = (endpoint || "").trim().replace(/\/+$/, "");
  if (custom) {
    if (!/^https?:\/\//i.test(custom)) {
      throw new Error("R2 endpoint must start with https://");
    }
    return custom;
  }
  const acct = (accountId || "").trim();
  if (!acct) {
    throw new Error("Cloudflare R2 Account ID or Endpoint is required");
  }
  return `https://${acct}.r2.cloudflarestorage.com`;
}

export function signR2Request(params: {
  method: "GET" | "PUT" | "HEAD" | "DELETE";
  endpoint: string;
  bucket: string;
  key?: string;
  accessKeyId: string;
  secretAccessKey: string;
  payload?: Uint8Array;
  contentType?: string;
  now?: Date;
}): { url: string; headers: Record<string, string> } {
  const {
    method,
    endpoint,
    bucket,
    key = "",
    accessKeyId,
    secretAccessKey,
    payload = new Uint8Array(0),
    contentType,
    now = new Date(),
  } = params;

  const parsedUrl = new URL(endpoint);
  const host = parsedUrl.host;
  const basePath = parsedUrl.pathname.replace(/\/+$/, "");
  const encodedBucket = encodeS3Path(bucket);
  const encodedKey = key ? `/${encodeS3Path(key)}` : "";
  const canonicalUri = `${basePath}/${encodedBucket}${encodedKey}`;
  const fullUrl = `${parsedUrl.origin}${canonicalUri}`;

  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const amzDate = iso;
  const dateStamp = iso.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const payloadHash = sha256Hex(payload);

  const headerEntries: [string, string][] = [
    ["host", host],
    ["x-amz-content-sha256", payloadHash],
    ["x-amz-date", amzDate],
  ];
  if (contentType) {
    headerEntries.push(["content-type", contentType]);
  }
  headerEntries.sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders = headerEntries
    .map(([k, v]) => `${k}:${v.trim()}\n`)
    .join("");
  const signedHeaders = headerEntries.map(([k]) => k).join(";");

  const canonicalRequest = [
    method,
    canonicalUri,
    "", // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    Authorization: authorization,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  return { url: fullUrl, headers };
}

export async function testR2Connection(config: R2Config): Promise<void> {
  const endpoint = buildR2Endpoint(config.accountId, config.endpoint);
  const { url, headers } = signR2Request({
    method: "HEAD",
    endpoint,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const res = await fetch(url, { method: "HEAD", headers });
  if (!res.ok) {
    throw new Error(
      `Cloudflare R2 connection failed (HTTP ${res.status}). Check Account ID, Bucket Name, and API Keys.`,
    );
  }
}

export async function uploadToR2(
  config: R2Config,
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  const endpoint = buildR2Endpoint(config.accountId, config.endpoint);
  const { url, headers } = signR2Request({
    method: "PUT",
    endpoint,
    bucket: config.bucket,
    key,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    payload: bytes,
    contentType,
  });

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: Buffer.from(bytes),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Cloudflare R2 upload failed (HTTP ${res.status})${text ? `: ${text.slice(0, 140)}` : ""}`,
    );
  }
}

export async function downloadFromR2(
  config: R2Config,
  key: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const endpoint = buildR2Endpoint(config.accountId, config.endpoint);
  const { url, headers } = signR2Request({
    method: "GET",
    endpoint,
    bucket: config.bucket,
    key,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const res = await fetch(url, { method: "GET", headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Cloudflare R2 read failed (HTTP ${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}

export function parseGcpServiceAccountJson(
  rawJson: string,
): ParsedGcpServiceAccount {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawJson.trim()) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid GCP Service Account JSON format");
  }

  const clientEmail =
    typeof parsed.client_email === "string" ? parsed.client_email.trim() : "";
  const privateKeyRaw =
    typeof parsed.private_key === "string" ? parsed.private_key : "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n").trim();
  const projectId =
    typeof parsed.project_id === "string" ? parsed.project_id.trim() : "";

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Service Account JSON must contain client_email and private_key",
    );
  }

  return { projectId, clientEmail, privateKey };
}

async function getGcpAccessToken(config: {
  clientEmail: string;
  privateKey: string;
}): Promise<string> {
  const normalizedKey = config.privateKey.replace(/\\n/g, "\n").trim();
  const pk = await importPKCS8(normalizedKey, "RS256");

  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/devstorage.read_write",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(config.clientEmail)
    .setSubject(config.clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(pk);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error_description?: string;
    error?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        `GCP OAuth token exchange failed (HTTP ${res.status})`,
    );
  }

  return data.access_token;
}

export async function testGcpConnection(config: GcpConfig): Promise<void> {
  const token = await getGcpAccessToken(config);
  const res = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(config.bucket)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    throw new Error(
      `GCP Cloud Storage check failed (HTTP ${res.status}). Check Bucket Name and Service Account permissions.`,
    );
  }
}

export async function uploadToGcp(
  config: GcpConfig,
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  const token = await getGcpAccessToken(config);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(
    config.bucket,
  )}/o?uploadType=media&name=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: Buffer.from(bytes),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GCP Cloud Storage upload failed (HTTP ${res.status})${text ? `: ${text.slice(0, 140)}` : ""}`,
    );
  }
}

export async function downloadFromGcp(
  config: GcpConfig,
  key: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const token = await getGcpAccessToken(config);
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(
    config.bucket,
  )}/o/${encodeURIComponent(key)}?alt=media`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GCP Cloud Storage read failed (HTTP ${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}

