import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import {
  isPrivateIpAddress,
  validateR2AccountId,
  validateSafeHttpsUrl,
} from "@/lib/security/network";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { isSafeUrl, sanitizeNoteHtml } from "@/lib/security/sanitize";
import { detectImageMagicBytes } from "@/lib/security/upload-validation";

describe("security hardening utilities", () => {
  it("encrypts and decrypts secrets with AES-256-GCM and rejects tampering", () => {
    const secret = "ghp_superSecretToken123456";
    const enc1 = encryptSecret(secret);
    const enc2 = encryptSecret(secret);

    expect(enc1).toMatch(/^enc:v1:/);
    expect(enc1).not.toBe(enc2); // random IV
    expect(enc1).not.toContain(secret);
    expect(decryptSecret(enc1)).toBe(secret);
    expect(decryptSecret("legacy-plaintext-token")).toBe(
      "legacy-plaintext-token",
    );

    const tampered = `${enc1.slice(0, -2)}AA`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("sanitizes stored XSS payloads while keeping safe Tiptap HTML", () => {
    const dirty = [
      "<h1>Spec</h1>",
      '<script>alert("xss")</script>',
      '<img src="/api/uploads/123.png" onerror="alert(1)" alt="Diagram">',
      '<a href="javascript:alert(1)">Bad Link</a>',
      '<a href="https://github.com/org/repo">Good Link</a>',
      '<svg onload="alert(2)"><circle /></svg>',
      '<iframe src="https://evil.com"></iframe>',
      '<pre><code class="language-ts">const x = 1;</code></pre>',
    ].join("");

    const clean = sanitizeNoteHtml(dirty);
    expect(clean).toContain("<h1>Spec</h1>");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("<svg");
    expect(clean).not.toContain("<iframe");
    expect(clean).toContain('<img src="/api/uploads/123.png" alt="Diagram">');
    expect(clean).toContain(
      '<a href="https://github.com/org/repo" rel="noopener noreferrer">Good Link</a>',
    );
    expect(clean).toContain(
      '<pre><code class="language-ts">const x = 1;</code></pre>',
    );

    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("//evil.com")).toBe(false);
    expect(isSafeUrl("https://example.com/path")).toBe(true);
    expect(isSafeUrl("/api/uploads/shot.png")).toBe(true);
  });

  it("validates image magic bytes and rejects spoofed non-image files", () => {
    const validPng = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    const validJpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const spoofedHtml = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const spoofedSvg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>");

    expect(detectImageMagicBytes(validPng)).toEqual({
      ext: "png",
      mimeType: "image/png",
    });
    expect(detectImageMagicBytes(validJpeg)).toEqual({
      ext: "jpg",
      mimeType: "image/jpeg",
    });
    expect(detectImageMagicBytes(spoofedHtml)).toBeNull();
    expect(detectImageMagicBytes(spoofedSvg)).toBeNull();
  });

  it("blocks SSRF targets (private IPs, localhost, http://, metadata hosts)", () => {
    expect(isPrivateIpAddress("127.0.0.1")).toBe(true);
    expect(isPrivateIpAddress("169.254.169.254")).toBe(true);
    expect(isPrivateIpAddress("10.0.0.5")).toBe(true);
    expect(isPrivateIpAddress("192.168.1.1")).toBe(true);
    expect(isPrivateIpAddress("::1")).toBe(true);
    expect(isPrivateIpAddress("8.8.8.8")).toBe(false);

    expect(() =>
      validateSafeHttpsUrl("http://127.0.0.1:8080", "Endpoint"),
    ).toThrow(/https/i);
    expect(() =>
      validateSafeHttpsUrl("https://169.254.169.254/latest", "Endpoint"),
    ).toThrow(/not allowed/i);
    expect(() =>
      validateSafeHttpsUrl("https://localhost:3000", "Endpoint"),
    ).toThrow(/not allowed/i);
    expect(() => validateR2AccountId("evil.com/path")).toThrow();
    expect(validateR2AccountId("abc123def456")).toBe("abc123def456");
  });

  it("enforces sliding rate limit caps", () => {
    const key = `test-rl-${Date.now()}`;
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed).toBe(
      true,
    );
    expect(checkRateLimit({ key, limit: 2, windowMs: 60_000 }).allowed).toBe(
      true,
    );
    const blocked = checkRateLimit({ key, limit: 2, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

