import { Language } from "./types";
import type { NextRequest } from "next/server";

export const COOKIE_LOCALE_KEY = "NEXT_LOCALE";
export const STORAGE_LOCALE_KEY = "wtl_preferred_language";
export const DEFAULT_FALLBACK_LANGUAGE: Language = "en";

/**
 * ISO 3166-1 alpha-2 country code to supported Language code mapping.
 * Easily extensible for future multi-language additions (e.g., ja, ko, zh, fr, de).
 */
export const COUNTRY_TO_LANGUAGE_MAP: Record<string, Language> = {
  // Current supported mappings:
  VN: "vi", // Vietnam -> Vietnamese

  // Future language readiness (uncomment when new language dictionaries are implemented):
  // JP: "ja", // Japan -> Japanese
  // KR: "ko", // South Korea -> Korean
  // CN: "zh", // China -> Chinese
  // TW: "zh", // Taiwan -> Chinese
  // FR: "fr", // France -> French
  // DE: "de", // Germany -> German
  // ES: "es", // Spain -> Spanish
};

/**
 * Detect matching language from ISO country code.
 * Falls back to DEFAULT_FALLBACK_LANGUAGE ("en") if country is not mapped or unrecognized.
 */
export function detectLanguageFromCountry(countryCode?: string | null): Language {
  if (!countryCode) {
    return DEFAULT_FALLBACK_LANGUAGE;
  }
  const normalizedCountry = countryCode.trim().toUpperCase();
  return COUNTRY_TO_LANGUAGE_MAP[normalizedCountry] || DEFAULT_FALLBACK_LANGUAGE;
}

/**
 * Extract country code from incoming NextRequest headers or query params.
 * Priority:
 * 1. Explicit dev/test query param (?geo=VN or ?geo=US)
 * 2. Vercel native edge header: "x-vercel-ip-country"
 * 3. Next.js Vercel geo property: req.geo?.country
 * 4. Cloudflare proxy header: "cf-ipcountry"
 * 5. Generic proxy header: "x-country-code"
 */
export function getCountryFromRequest(req: NextRequest): {
  country: string | null;
  source: string;
} {
  // 1. Dev/Testing override via query string (e.g. ?geo=VN)
  const queryGeo = req.nextUrl.searchParams.get("geo");
  if (queryGeo) {
    return { country: queryGeo.toUpperCase(), source: "query_param" };
  }

  // 2. Vercel IP Country header
  const vercelCountry = req.headers.get("x-vercel-ip-country");
  if (vercelCountry && vercelCountry !== "XX") {
    return { country: vercelCountry.toUpperCase(), source: "x-vercel-ip-country" };
  }

  // 3. Vercel geo object in Edge middleware
  const vercelGeo = (req as { geo?: { country?: string } }).geo?.country;
  if (vercelGeo && vercelGeo !== "XX") {
    return { country: vercelGeo.toUpperCase(), source: "req.geo" };
  }

  // 4. Cloudflare IP country header
  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") {
    return { country: cfCountry.toUpperCase(), source: "cf-ipcountry" };
  }

  // 5. Generic proxy header
  const genericCountry = req.headers.get("x-country-code");
  if (genericCountry) {
    return { country: genericCountry.toUpperCase(), source: "x-country-code" };
  }

  return { country: null, source: "none" };
}
