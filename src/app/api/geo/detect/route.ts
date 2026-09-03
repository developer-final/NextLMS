import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getCountryFromRequest,
  detectLanguageFromCountry,
  DEFAULT_FALLBACK_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const { country, source } = getCountryFromRequest(req);
  const detectedLanguage = detectLanguageFromCountry(country);

  // Extract client IP for diagnostic information
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "unknown";

  return NextResponse.json({
    success: true,
    detectedCountry: country || "UNKNOWN",
    detectedLanguage,
    isVietnameseIp: country === "VN",
    fallbackLanguage: DEFAULT_FALLBACK_LANGUAGE,
    source,
    clientIp,
    supportedLanguages: SUPPORTED_LANGUAGES.map((item) => ({
      code: item.code,
      label: item.label,
    })),
    timestamp: new Date().toISOString(),
  });
}
