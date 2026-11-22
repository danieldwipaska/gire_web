import crypto from "crypto";

const ENC_PREFIX = "enc:v1:";

function getEncryptionKey(): Buffer {
  const rawSecret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  if (
    process.env.NODE_ENV === "production" &&
    (!rawSecret || rawSecret.length < 16 || rawSecret === "your-secret-key")
  ) {
    throw new Error(
      "ENCRYPTION_KEY or a strong JWT_SECRET (min 16 chars) must be set in production.",
    );
  }
  const effectiveSecret =
    rawSecret || "gire-dev-ephemeral-encryption-fallback-only";
  return crypto.createHash("sha256").update(effectiveSecret).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  if (plaintext.startsWith(ENC_PREFIX)) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith(ENC_PREFIX)) {
    // Legacy plaintext record compatibility
    return stored;
  }

  const rest = stored.slice(ENC_PREFIX.length);
  const parts = rest.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted secret");
  }

  const [ivB64, tagB64, cipherB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(cipherB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

