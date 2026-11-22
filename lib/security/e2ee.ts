const E2EE_PREFIX = "gire-e2ee:v1:";
const KDF_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

const ENVELOPE_REGEX =
  /^gire-e2ee:v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: KDF_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

export function isE2eeEnvelope(value: string): boolean {
  return ENVELOPE_REGEX.test(value.trim());
}

/**
 * Encrypts note HTML strictly on the client using Web Crypto PBKDF2 + AES-256-GCM.
 * Returns an opaque envelope string safe to send to and store on the server.
 */
export async function encryptNoteContent(
  plaintextHtml: string,
  passphrase: string,
): Promise<string> {
  if (!passphrase || passphrase.length < 6) {
    throw new Error("Passphrase must be at least 6 characters");
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Web Crypto API is unavailable (requires HTTPS or localhost)",
    );
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveAesKey(passphrase, salt, ["encrypt"]);

  const encoded = new TextEncoder().encode(plaintextHtml);
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    encoded,
  );

  return `${E2EE_PREFIX}${toBase64(salt)}:${toBase64(iv)}:${toBase64(
    new Uint8Array(cipherBuffer),
  )}`;
}

/**
 * Decrypts a client-encrypted E2EE note envelope using the user's passphrase.
 * Throws if the passphrase is incorrect or the ciphertext was tampered with.
 */
export async function decryptNoteContent(
  envelope: string,
  passphrase: string,
): Promise<string> {
  if (!passphrase) {
    throw new Error("Passphrase is required");
  }
  if (!isE2eeEnvelope(envelope)) {
    throw new Error("Invalid encrypted note format");
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "Web Crypto API is unavailable (requires HTTPS or localhost)",
    );
  }

  const rest = envelope.trim().slice(E2EE_PREFIX.length);
  const [saltB64, ivB64, cipherB64] = rest.split(":");

  const salt = fromBase64(saltB64);
  const iv = fromBase64(ivB64);
  const cipherBytes = fromBase64(cipherB64);

  const key = await deriveAesKey(passphrase, salt, ["decrypt"]);
  try {
    const plainBuffer = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(cipherBytes),
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    throw new Error("Incorrect passphrase or corrupted note data");
  }
}

