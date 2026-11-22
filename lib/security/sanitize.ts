const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "label",
  "input",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "colgroup",
  "col",
  "a",
  "img",
  "hr",
  "span",
  "div",
]);

const VOID_TAGS = new Set(["br", "hr", "img", "input", "col"]);

const DANGEROUS_CONTENT_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
  "form",
  "textarea",
  "select",
  "option",
  "noscript",
  "template",
];

const GLOBAL_SAFE_ATTRS = new Set([
  "class",
  "data-type",
  "data-checked",
  "colspan",
  "rowspan",
]);

function decodeEntitiesMinimal(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);?/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    );
}

function escapeAttr(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function isSafeUrl(rawUrl: string, allowMailto = true): boolean {
  const trimmed = decodeEntitiesMinimal(rawUrl)
    .replace(/[\u0000-\u001f\u007f\s]+/g, "")
    .trim();
  if (!trimmed) return false;

  // Relative paths like /api/uploads/... (but reject protocol-relative //evil.com)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return true;
    }
    if (allowMailto && parsed.protocol === "mailto:") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function sanitizeAttributes(tag: string, rawAttrs: string): string {
  const attrs: string[] = [];
  const attrRegex =
    /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  let match: RegExpExecArray | null;
  let hasHref = false;

  while ((match = attrRegex.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase();
    const rawValue = match[2] ?? match[3] ?? match[4] ?? "";

    // Block all event handlers, inline styles, and unsafe attributes
    if (name.startsWith("on") || name === "style" || name === "srcdoc") {
      continue;
    }

    if (tag === "a") {
      if (name === "href" && isSafeUrl(rawValue, true)) {
        attrs.push(`href="${escapeAttr(rawValue.trim())}"`);
        hasHref = true;
      } else if (name === "target" && rawValue === "_blank") {
        attrs.push('target="_blank"');
      }
      continue;
    }

    if (tag === "img") {
      if (name === "src" && isSafeUrl(rawValue, false)) {
        attrs.push(`src="${escapeAttr(rawValue.trim())}"`);
      } else if (name === "alt" || name === "title") {
        attrs.push(`${name}="${escapeAttr(rawValue)}"`);
      } else if (
        (name === "width" || name === "height") &&
        /^\d{1,5}$/.test(rawValue.trim())
      ) {
        attrs.push(`${name}="${rawValue.trim()}"`);
      }
      continue;
    }

    if (tag === "input") {
      if (name === "type" && rawValue.toLowerCase() === "checkbox") {
        attrs.push('type="checkbox"');
      } else if (name === "checked") {
        attrs.push("checked");
      } else if (name === "disabled") {
        attrs.push("disabled");
      }
      continue;
    }

    if (GLOBAL_SAFE_ATTRS.has(name)) {
      if (name === "class") {
        const safeClass = rawValue.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
        if (safeClass) attrs.push(`class="${safeClass}"`);
      } else {
        attrs.push(`${name}="${escapeAttr(rawValue)}"`);
      }
    }
  }

  if (tag === "a" && hasHref) {
    attrs.push('rel="noopener noreferrer"');
  }

  return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
}

/**
 * Sanitizes rich-text HTML produced by Tiptap notes on the server before storing
 * to MongoDB, blocking XSS vectors (<script>, event handlers, javascript: URIs).
 */
export function sanitizeNoteHtml(html: string): string {
  if (!html) return "";

  let cleaned = html
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "");

  // Remove dangerous tags together with their inner content
  for (const dangerous of DANGEROUS_CONTENT_TAGS) {
    const blockRegex = new RegExp(
      `<${dangerous}\\b[^>]*>[\\s\\S]*?<\\/${dangerous}>`,
      "gi",
    );
    const selfClosingRegex = new RegExp(`<${dangerous}\\b[^>]*\\/?>`, "gi");
    cleaned = cleaned.replace(blockRegex, "").replace(selfClosingRegex, "");
  }

  // Filter all remaining tags against allowlist
  cleaned = cleaned.replace(
    /<(\/?)([a-zA-Z0-9-]+)([^>]*)>/g,
    (_full, slash: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        return "";
      }
      if (slash === "/") {
        return VOID_TAGS.has(tag) ? "" : `</${tag}>`;
      }
      const attrs = sanitizeAttributes(tag, rawAttrs);
      return `<${tag}${attrs}>`;
    },
  );

  return cleaned;
}

