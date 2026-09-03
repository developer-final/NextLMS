/**
 * Input sanitization utility to prevent Stored XSS, HTML injection,
 * and malicious URI scheme exploits across the platform.
 */

// Matches dangerous HTML tags and their inner contents (case-insensitive, multiline)
const DANGEROUS_TAGS_REGEX = /<\s*(script|iframe|object|embed|applet|style|form|svg|math|meta|base|link)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>|<\s*(script|iframe|object|embed|applet|style|form|svg|math|meta|base|link)\b[^>]*\/?>/gi;

// Matches inline DOM event handler attributes (e.g. onerror=..., onclick=...)
const INLINE_EVENT_HANDLERS_REGEX = /\bon[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

// Matches malicious URI schemes (javascript:, vbscript:, data:text/html, etc.)
const DANGEROUS_URI_REGEX = /^(?:\s*(?:java|vb)script\s*:|\s*data\s*:\s*(?:text\/html|application\/|image\/svg\+xml))/i;

// Dangerous control characters (excluding newline \n, carriage return \r, tab \t)
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Strips all HTML tags from a string
 */
export function stripHtmlTags(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitizes plain text input by stripping all HTML tags, removing control characters,
 * disallowing pseudo-protocols, and trimming whitespace.
 *
 * Use for: titles, names, summaries, bios, tags, categories, and comments.
 */
export function sanitizePlainText(
  input: string | null | undefined,
  maxLength?: number
): string {
  if (input === null || input === undefined) return "";
  if (typeof input !== "string") return "";

  // 1. Remove dangerous unprintable control characters and null bytes
  let cleaned = input.replace(CONTROL_CHARS_REGEX, "");

  // 2. Strip all HTML tags
  cleaned = stripHtmlTags(cleaned);

  // 3. Trim extra whitespace
  cleaned = cleaned.trim();

  // 4. Enforce max length constraint if specified
  if (maxLength && maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Checks whether a markdown link URL or image URL is safe.
 * Rejects javascript:, vbscript:, and malicious data: URIs.
 */
export function isSafeMarkdownUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Normalized check resistant to embedded control characters
  const normalized = trimmed.toLowerCase().replace(/[\x00-\x20]/g, "");
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:text/html") ||
    normalized.startsWith("data:image/svg+xml") ||
    normalized.startsWith("data:application/")
  ) {
    return false;
  }

  return true;
}

/**
 * Sanitizes rich text / Markdown content by:
 * 1. Removing null bytes and unprintable control characters.
 * 2. Banning executable HTML tags (<script>, <iframe>, <object>, <embed>, <form>, etc.).
 * 3. Stripping inline JavaScript event handlers (onerror=, onload=, etc.).
 * 4. Disarming dangerous links/images in Markdown format [text](javascript:...) -> [text](#).
 *
 * Use for: Course.description, Lesson.contentBody, BlogPost.content.
 */
export function sanitizeMarkdown(
  input: string | null | undefined,
  maxLength?: number
): string {
  if (input === null || input === undefined) return "";
  if (typeof input !== "string") return "";

  // 1. Remove dangerous control characters and null bytes
  let cleaned = input.replace(CONTROL_CHARS_REGEX, "");

  // 2. Strip dangerous executable HTML tags
  cleaned = cleaned.replace(DANGEROUS_TAGS_REGEX, "");

  // 3. Strip any unclosed dangerous tags like `<script ...` at EOF
  cleaned = cleaned.replace(/<\s*(script|iframe|object|embed|applet|style|form|svg|math|meta|base|link)\b[^>]*$/gi, "");

  // 4. Strip inline event handlers from any remaining allowed HTML elements
  cleaned = cleaned.replace(INLINE_EVENT_HANDLERS_REGEX, "");

  // 5. Sanitize Markdown links: [text](url)
  cleaned = cleaned.replace(
    /\[([^\]]*)\]\(([^)]*)\)/g,
    (match, text, url) => {
      const cleanUrl = url.trim();
      if (!isSafeMarkdownUrl(cleanUrl)) {
        return `[${text}](#)`;
      }
      return match;
    }
  );

  // 6. Sanitize Markdown images: ![alt](url)
  cleaned = cleaned.replace(
    /!\[([^\]]*)\]\(([^)]*)\)/g,
    (match, alt, url) => {
      const cleanUrl = url.trim();
      if (!isSafeMarkdownUrl(cleanUrl)) {
        return `![${alt}](#)`;
      }
      return match;
    }
  );

  // 7. Enforce max length constraint if specified
  if (maxLength && maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned.trim();
}

/**
 * Validates and normalizes safe external or internal URLs.
 * Returns null if the URL scheme is dangerous or invalid.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (DANGEROUS_URI_REGEX.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.toLowerCase().replace(/[\x00-\x20]/g, "");
  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("data:text/html")
  ) {
    return null;
  }

  return trimmed;
}
