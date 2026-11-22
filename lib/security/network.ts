import dns from "dns/promises";
import net from "net";

export function isPrivateIpAddress(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  if (!normalized) return true;

  // Handle IPv4-mapped IPv6 addresses like ::ffff:127.0.0.1
  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpAddress(normalized.slice(7));
  }

  const version = net.isIP(normalized);
  if (version === 4) {
    const parts = normalized.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;

    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a === 127) return true; // Loopback 127.0.0.0/8
    if (a === 169 && b === 254) return true; // Link-local / Cloud Metadata 169.254.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918 172.16.0.0/12
    if (a === 192 && b === 168) return true; // RFC1918 192.168.0.0/16
    if (a >= 224) return true; // Multicast / reserved
    return false;
  }

  if (version === 6) {
    if (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    ) {
      return true;
    }
    return false;
  }

  return true;
}

export function isBlockedHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".arpa") ||
    h === "metadata.google.internal"
  ) {
    return true;
  }
  if (net.isIP(h) !== 0 && isPrivateIpAddress(h)) {
    return true;
  }
  return false;
}

export function validateR2AccountId(accountId: string): string {
  const trimmed = accountId.trim();
  if (!trimmed) {
    throw new Error("Cloudflare R2 Account ID or Endpoint is required");
  }
  if (!/^[a-zA-Z0-9-]{6,64}$/.test(trimmed)) {
    throw new Error(
      "Cloudflare R2 Account ID must be 6-64 alphanumeric/hyphen characters",
    );
  }
  return trimmed;
}

export function validateSafeHttpsUrl(
  rawUrl: string,
  fieldName = "URL",
): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error(`Invalid ${fieldName}`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use https://`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${fieldName} must not contain credentials`);
  }
  if (parsed.search || parsed.hash) {
    throw new Error(`${fieldName} must not include query strings or fragments`);
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error(`${fieldName} host is not allowed`);
  }

  return parsed.toString().replace(/\/+$/, "");
}

export async function assertPublicHttpsDestination(
  rawUrl: string,
  fieldName = "Endpoint",
): Promise<string> {
  const normalized = validateSafeHttpsUrl(rawUrl, fieldName);
  const { hostname } = new URL(normalized);

  if (net.isIP(hostname) !== 0) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error(`${fieldName} cannot target a private IP address`);
    }
    return normalized;
  }

  const records = await dns.lookup(hostname, { all: true }).catch(() => []);
  if (records.length === 0) {
    throw new Error(`${fieldName} hostname could not be resolved`);
  }
  for (const record of records) {
    if (isPrivateIpAddress(record.address)) {
      throw new Error(
        `${fieldName} resolved to a blocked private or loopback IP address`,
      );
    }
  }

  return normalized;
}

